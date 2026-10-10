import { randomUUID } from "node:crypto";
import type { Account } from "@prisma/client";
import { DEFAULT_POLICY, type ChainReference, type Decision, type DecisionStatus, type EvaluatePaymentRequest } from "@payguard/shared";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { getChainClient } from "@/lib/chain";
import { HttpError } from "@/lib/http";
import { toDecisionDto, toKillSwitchDto, toPolicyDto } from "@/lib/mappers";
import { evaluate } from "./evaluate";
import { templateExplanation } from "./explain";
import { computeDecisionHash, toBytes32 } from "./hash";
import type { GuardianContext, HistoricalDecision } from "./types";

export function newDecisionId(): string {
  return `dec_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export async function loadPolicy(accountId: string) {
  const row = await prisma.policy.findUnique({ where: { accountId } });
  return row ? toPolicyDto(row) : DEFAULT_POLICY;
}

export async function loadKillSwitch(accountId: string) {
  return toKillSwitchDto(await prisma.killSwitch.findUnique({ where: { accountId } }));
}

async function loadHistory(accountId: string): Promise<HistoricalDecision[]> {
  const rows = await prisma.decision.findMany({ where: { accountId }, orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map((r) => ({
    amount: r.amount,
    recipient_address: r.recipientAddress,
    recipient_domain: r.recipientDomain ?? undefined,
    purpose: r.purpose,
    verdict: r.verdict as HistoricalDecision["verdict"],
    status: r.status,
    created_at: r.createdAt.toISOString(),
  }));
}

export interface ProcessResult {
  decision: Decision;
  /** true when the decision already existed (idempotent replay). */
  replayed: boolean;
}

/**
 * The guardian's main path: idempotency → context → rules → chain → persist → audit.
 * Throws HttpError(KILL_SWITCH_ACTIVE) after recording the BLOCKED decision.
 */
export async function processPaymentRequest(account: Account, request: EvaluatePaymentRequest): Promise<ProcessResult> {
  const existing = await prisma.decision.findUnique({
    where: { accountId_requestId: { accountId: account.id, requestId: request.request_id } },
  });
  if (existing) return { decision: toDecisionDto(existing), replayed: true };

  const chain = getChainClient();
  const [policy, killSwitch, history, balance, recipientInfo] = await Promise.all([
    loadPolicy(account.id),
    loadKillSwitch(account.id),
    loadHistory(account.id),
    chain.getBalance(),
    chain.getAddressInfo(request.recipient.address).catch((err) => {
      console.warn("[guardian] getAddressInfo failed, skipping on-chain reputation", err);
      return undefined;
    }),
  ]);

  const ctx: GuardianContext = { request, policy, balance, killSwitchActive: killSwitch.active, history, recipientInfo, now: new Date() };
  const evaluation = evaluate(ctx);

  const decisionId = newDecisionId();
  const createdAt = new Date();
  const decisionHash = computeDecisionHash({
    decision_id: decisionId,
    request_id: request.request_id,
    agent_id: request.agent_id,
    amount: request.amount,
    currency: "AVAX",
    recipient: { address: request.recipient.address },
    purpose: request.purpose,
    verdict: evaluation.verdict,
    score: evaluation.score,
    reasons: evaluation.reasons,
    created_at: createdAt.toISOString(),
  });
  const explanation = templateExplanation(evaluation.verdict, evaluation.score, evaluation.reasons, request);

  // Chain step: APPROVED pays, everything else is recorded as proof.
  let status: DecisionStatus;
  let paymentTx: ChainReference | null = null;
  let ledgerTx: ChainReference | null = null;
  let resolved: { at: Date; by: "guardian" } | null = null;
  const hash32 = toBytes32(decisionHash);
  try {
    if (evaluation.verdict === "APPROVED") {
      paymentTx = await chain.executePayment(decisionId, request.recipient.address as `0x${string}`, request.amount, hash32);
      ledgerTx = paymentTx; // pay() anchors the hash in the same transaction
      status = "APPROVED";
      resolved = { at: new Date(), by: "guardian" };
    } else if (evaluation.verdict === "HOLD") {
      ledgerTx = await chain.recordDecision(decisionId, 1, hash32);
      status = "PENDING_CONFIRMATION";
    } else {
      ledgerTx = await chain.recordDecision(decisionId, 2, hash32);
      status = "BLOCKED";
      resolved = { at: new Date(), by: "guardian" };
    }
  } catch (err) {
    console.error("[guardian] chain error", err);
    status = evaluation.verdict === "APPROVED" ? "FAILED" : evaluation.verdict === "HOLD" ? "PENDING_CONFIRMATION" : "BLOCKED";
    resolved = evaluation.verdict === "HOLD" ? null : { at: new Date(), by: "guardian" };
  }

  const row = await prisma.decision.create({
    data: {
      id: decisionId,
      accountId: account.id,
      agentId: request.agent_id,
      requestId: request.request_id,
      amount: request.amount,
      currency: "AVAX",
      recipientAddress: request.recipient.address.toLowerCase(),
      recipientName: request.recipient.name ?? null,
      recipientDomain: request.recipient.domain?.toLowerCase() ?? null,
      purpose: request.purpose,
      score: evaluation.score,
      verdict: evaluation.verdict,
      status,
      reasonsJson: JSON.stringify(evaluation.reasons),
      complianceJson: JSON.stringify(evaluation.compliance),
      explanation,
      decisionHash,
      paymentTxJson: paymentTx ? JSON.stringify(paymentTx) : null,
      ledgerTxJson: ledgerTx ? JSON.stringify(ledgerTx) : null,
      contextJson: request.context ? JSON.stringify(request.context) : null,
      createdAt,
      resolvedAt: resolved?.at ?? null,
      resolvedBy: resolved?.by ?? null,
    },
  });

  // Remember every recipient we have seen, so the dashboard can trust them later.
  await prisma.recipient.upsert({
    where: { accountId_address: { accountId: account.id, address: row.recipientAddress } },
    create: { accountId: account.id, address: row.recipientAddress, name: row.recipientName, domain: row.recipientDomain },
    update: {},
  });

  await appendAudit(account.id, "DECISION_CREATED", {
    decision_id: decisionId,
    request_id: request.request_id,
    agent_id: request.agent_id,
    amount: request.amount,
    recipient: row.recipientAddress,
    verdict: evaluation.verdict,
    score: evaluation.score,
    reasons: evaluation.reasons.map((r) => r.code),
    decision_hash: decisionHash,
  });
  if (status === "APPROVED" && paymentTx) {
    await appendAudit(account.id, "PAYMENT_EXECUTED", { decision_id: decisionId, tx_hash: paymentTx.tx_hash, amount: request.amount });
  } else if (status === "FAILED") {
    await appendAudit(account.id, "PAYMENT_FAILED", { decision_id: decisionId, amount: request.amount });
  }

  const decision = toDecisionDto(row);
  if (killSwitch.active) {
    throw new HttpError("KILL_SWITCH_ACTIVE", "All payments are suspended by the account owner (kill switch active).", {
      decision_id: decision.decision_id,
      status_url: decision.status_url,
      reason: killSwitch.reason,
    });
  }
  return { decision, replayed: false };
}
