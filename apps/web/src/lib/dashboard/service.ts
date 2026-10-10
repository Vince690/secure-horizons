import bcrypt from "bcryptjs";
import type { Account } from "@prisma/client";
import { DEFAULT_POLICY, toBytes32, type ChainReference, type Decision, type Framework, type SpendingPolicy } from "@payguard/shared";
import { appendAudit } from "@/lib/audit";
import { generateApiKey } from "@/lib/auth/apiKey";
import { getChainClient } from "@/lib/chain";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { toDecisionDto, toPolicyRow } from "@/lib/mappers";

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function signup(email: string, password: string, companyName: string): Promise<Account> {
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) throw new HttpError("INVALID_REQUEST", "An account already exists for this email");
  const passwordHash = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({ data: { email, passwordHash, companyName } });
  await prisma.policy.create({ data: toPolicyRow(account.id, DEFAULT_POLICY) });
  await prisma.killSwitch.create({ data: { accountId: account.id, active: false } });
  await appendAudit(account.id, "POLICY_UPDATED", { reason: "account created, default policy", policy: DEFAULT_POLICY });
  return account;
}

export async function login(email: string, password: string): Promise<Account> {
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    throw new HttpError("UNAUTHORIZED", "Invalid email or password");
  }
  return account;
}

export function toAccountDto(a: Account) {
  return { id: a.id, email: a.email, company_name: a.companyName, created_at: a.createdAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export async function updatePolicy(accountId: string, policy: SpendingPolicy): Promise<SpendingPolicy> {
  const row = toPolicyRow(accountId, policy);
  await prisma.policy.upsert({ where: { accountId }, update: row, create: row });
  // Keep the recipient registry in sync with the trusted list.
  for (const address of policy.trusted_recipients) {
    await prisma.recipient.upsert({
      where: { accountId_address: { accountId, address: address.toLowerCase() } },
      update: { trusted: true },
      create: { accountId, address: address.toLowerCase(), trusted: true },
    });
  }
  await appendAudit(accountId, "POLICY_UPDATED", policy);
  return policy;
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

export async function listApiKeys(accountId: string) {
  const rows = await prisma.apiKey.findMany({ where: { accountId }, orderBy: { createdAt: "desc" } });
  return rows.map((k) => ({ id: k.id, prefix: k.prefix, label: k.label, created_at: k.createdAt.toISOString(), revoked_at: k.revokedAt?.toISOString() ?? null }));
}

export async function createApiKey(accountId: string, label: string) {
  const { key, keyHash, prefix } = generateApiKey();
  const row = await prisma.apiKey.create({ data: { accountId, keyHash, prefix, label } });
  await appendAudit(accountId, "API_KEY_CREATED", { id: row.id, prefix, label });
  // The clear key is returned exactly once.
  return { id: row.id, key, prefix, label, created_at: row.createdAt.toISOString() };
}

export async function revokeApiKey(accountId: string, id: string) {
  const row = await prisma.apiKey.findFirst({ where: { id, accountId } });
  if (!row) throw new HttpError("NOT_FOUND", "API key not found");
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}

// ---------------------------------------------------------------------------
// Decisions: human confirmation of HOLD
// ---------------------------------------------------------------------------

export async function listDecisions(accountId: string, status?: string, limit = 50): Promise<Decision[]> {
  const rows = await prisma.decision.findMany({
    where: { accountId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toDecisionDto);
}

export async function getDecision(accountId: string, id: string) {
  const row = await prisma.decision.findFirst({ where: { id, accountId } });
  if (!row) throw new HttpError("NOT_FOUND", `Decision ${id} not found`);
  return row;
}

export async function approveDecision(accountId: string, id: string): Promise<Decision> {
  const row = await getDecision(accountId, id);
  if (row.status !== "PENDING_CONFIRMATION") throw new HttpError("INVALID_REQUEST", `Decision is ${row.status}, not pending`);
  const killSwitch = await prisma.killSwitch.findUnique({ where: { accountId } });
  if (killSwitch?.active) throw new HttpError("KILL_SWITCH_ACTIVE", "Kill switch is active: re-arm it before approving payments");

  const chain = getChainClient();
  let paymentTx: ChainReference | null = null;
  let status: "APPROVED" | "FAILED" = "APPROVED";
  try {
    // The HOLD was already anchored under the decision id; the human approval
    // is a second on-chain entry under "<id>:approved" carrying the same hash.
    paymentTx = await chain.executePayment(`${row.id}:approved`, row.recipientAddress as `0x${string}`, row.amount, toBytes32(row.decisionHash));
  } catch (err) {
    console.error("[dashboard] approve: chain error", err);
    status = "FAILED";
  }
  const updated = await prisma.decision.update({
    where: { id },
    data: { status, paymentTxJson: paymentTx ? JSON.stringify(paymentTx) : null, resolvedAt: new Date(), resolvedBy: "human" },
  });
  await appendAudit(accountId, "DECISION_RESOLVED", { decision_id: id, resolution: "approved", by: "human" });
  if (paymentTx) await appendAudit(accountId, "PAYMENT_EXECUTED", { decision_id: id, tx_hash: paymentTx.tx_hash, amount: row.amount, by: "human" });
  else await appendAudit(accountId, "PAYMENT_FAILED", { decision_id: id, amount: row.amount, by: "human" });
  return toDecisionDto(updated);
}

export async function rejectDecision(accountId: string, id: string): Promise<Decision> {
  const row = await getDecision(accountId, id);
  if (row.status !== "PENDING_CONFIRMATION") throw new HttpError("INVALID_REQUEST", `Decision is ${row.status}, not pending`);
  const chain = getChainClient();
  let ledgerTx: ChainReference | null = null;
  try {
    ledgerTx = await chain.recordDecision(`${row.id}:rejected`, 3, toBytes32(row.decisionHash));
  } catch (err) {
    console.error("[dashboard] reject: chain error", err);
  }
  const updated = await prisma.decision.update({
    where: { id },
    data: { status: "REJECTED", ledgerTxJson: ledgerTx ? JSON.stringify(ledgerTx) : row.ledgerTxJson, resolvedAt: new Date(), resolvedBy: "human" },
  });
  await appendAudit(accountId, "DECISION_RESOLVED", { decision_id: id, resolution: "rejected", by: "human" });
  return toDecisionDto(updated);
}

// Kill switch lives in src/lib/killswitch.ts (shared with the guardian's auto trigger).
export { setKillSwitch } from "@/lib/killswitch";

// ---------------------------------------------------------------------------
// Compliance panel: last 24h, per framework
// ---------------------------------------------------------------------------

export interface ComplianceReport {
  window_hours: number;
  decisions: { total: number; approved: number; hold: number; blocked: number; pending: number };
  frameworks: Record<Framework, { state: "ok" | "warn" | "fail"; fail: number; warn: number; top_reasons: string[] }>;
  incidents: Array<{ at: string; event: string; reason: string | null; by: string | null }>;
}

export async function complianceReport(accountId: string): Promise<ComplianceReport> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await prisma.decision.findMany({ where: { accountId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
  const decisions = rows.map(toDecisionDto);
  const frameworks = {} as ComplianceReport["frameworks"];
  for (const f of ["DORA", "MiCA", "AML_CFT", "AI_ACT"] as Framework[]) {
    const counts = new Map<string, number>();
    let fail = 0;
    let warn = 0;
    for (const d of decisions) {
      if (d.compliance[f] === "fail") fail += 1;
      if (d.compliance[f] === "warn") warn += 1;
      for (const r of d.reasons) if (r.delta < 0 && r.frameworks.includes(f)) counts.set(r.code, (counts.get(r.code) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([code]) => code);
    frameworks[f] = { state: fail > 0 ? "fail" : warn > 0 ? "warn" : "ok", fail, warn, top_reasons: top };
  }
  const audits = await prisma.auditEntry.findMany({
    where: { accountId, event: { in: ["KILL_SWITCH_ON", "KILL_SWITCH_OFF"] }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return {
    window_hours: 24,
    decisions: {
      total: decisions.length,
      approved: decisions.filter((d) => d.status === "APPROVED").length,
      hold: decisions.filter((d) => d.verdict === "HOLD").length,
      blocked: decisions.filter((d) => d.status === "BLOCKED").length,
      pending: decisions.filter((d) => d.status === "PENDING_CONFIRMATION").length,
    },
    frameworks,
    incidents: audits.map((a) => {
      const payload = JSON.parse(a.payloadJson) as { reason?: string; by?: string };
      return { at: a.createdAt.toISOString(), event: a.event, reason: payload.reason ?? null, by: payload.by ?? null };
    }),
  };
}
