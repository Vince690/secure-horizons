import type { Decision as DecisionRow, KillSwitch as KillSwitchRow, Policy as PolicyRow, VirtualCard as VirtualCardRow } from "@prisma/client";
import type { ChainReference, Decision, KillSwitchState, SpendingPolicy } from "@payguard/shared";
import { toCardSummary } from "@/lib/rails/sandboxIssuer";

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export function toPolicyDto(row: PolicyRow): SpendingPolicy {
  return {
    max_per_tx: row.maxPerTx,
    max_daily: row.maxDaily,
    min_balance: row.minBalance,
    auto_approve_score: row.autoApproveScore,
    hold_score: row.holdScore,
    require_confirmation_above: row.requireConfirmationAbove,
    confirm_new_recipients: row.confirmNewRecipients,
    card: {
      max_per_tx: row.cardMaxPerTx,
      max_daily: row.cardMaxDaily,
      min_balance: row.cardMinBalance,
      require_confirmation_above: row.cardRequireConfirmationAbove,
    },
    trusted_recipients: parseJson<string[]>(row.trustedRecipients, []),
    blocked_recipients: parseJson<string[]>(row.blockedRecipients, []),
    trusted_domains: parseJson<string[]>(row.trustedDomains, []),
  };
}

export function toPolicyRow(accountId: string, policy: SpendingPolicy) {
  return {
    accountId,
    maxPerTx: policy.max_per_tx,
    maxDaily: policy.max_daily,
    minBalance: policy.min_balance,
    autoApproveScore: policy.auto_approve_score,
    holdScore: policy.hold_score,
    requireConfirmationAbove: policy.require_confirmation_above,
    confirmNewRecipients: policy.confirm_new_recipients,
    cardMaxPerTx: policy.card.max_per_tx,
    cardMaxDaily: policy.card.max_daily,
    cardMinBalance: policy.card.min_balance,
    cardRequireConfirmationAbove: policy.card.require_confirmation_above,
    trustedRecipients: JSON.stringify(policy.trusted_recipients.map((a) => a.toLowerCase())),
    blockedRecipients: JSON.stringify(policy.blocked_recipients.map((a) => a.toLowerCase())),
    trustedDomains: JSON.stringify(policy.trusted_domains.map((d) => d.toLowerCase())),
  };
}

export function toDecisionDto(row: DecisionRow, card?: VirtualCardRow | null): Decision {
  return {
    decision_id: row.id,
    request_id: row.requestId,
    agent_id: row.agentId,
    verdict: row.verdict as Decision["verdict"],
    status: row.status as Decision["status"],
    score: row.score,
    reasons: parseJson(row.reasonsJson, []),
    compliance: parseJson(row.complianceJson, { DORA: "ok", MiCA: "ok", AML_CFT: "ok", AI_ACT: "ok" }),
    explanation: row.explanation,
    amount: row.amount,
    currency: row.currency as Decision["currency"],
    rail: (row.rail as Decision["rail"]) ?? "avalanche",
    recipient: {
      address: row.recipientAddress,
      ...(row.recipientName ? { name: row.recipientName } : {}),
      ...(row.recipientDomain ? { domain: row.recipientDomain } : {}),
    },
    purpose: row.purpose,
    payment_tx: parseJson<ChainReference | null>(row.paymentTxJson, null),
    card: card ? toCardSummary(card) : null,
    ledger_tx: parseJson<ChainReference | null>(row.ledgerTxJson, null),
    decision_hash: row.decisionHash,
    created_at: row.createdAt.toISOString(),
    resolved_at: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    resolved_by: (row.resolvedBy as Decision["resolved_by"]) ?? null,
    status_url: `/api/v1/payments/${row.id}`,
  };
}

export function toKillSwitchDto(row: KillSwitchRow | null): KillSwitchState {
  if (!row) return { active: false, reason: null, activated_at: null, onchain_tx: null };
  return {
    active: row.active,
    reason: row.reason ?? null,
    activated_at: row.activatedAt ? row.activatedAt.toISOString() : null,
    onchain_tx: parseJson<ChainReference | null>(row.onchainTxJson, null),
  };
}
