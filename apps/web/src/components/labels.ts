import { COMPLIANCE_RULES, type DecisionStatus, type Framework, type ReasonCode, type Verdict } from "@payguard/shared";

export const FRAMEWORK_LABEL: Record<Framework, { short: string; long: string }> = {
  DORA: { short: "DORA", long: "Operational Resilience (DORA)" },
  MiCA: { short: "MiCA", long: "Crypto-asset Markets (MiCA)" },
  AML_CFT: { short: "AML / CFT", long: "Anti-money laundering (AML / CFT)" },
  AI_ACT: { short: "AI Act", long: "AI Regulation (AI Act)" },
};

export const VERDICT_LABEL: Record<Verdict, string> = { APPROVED: "Approved", HOLD: "On hold", BLOCKED: "Blocked" };

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  APPROVED: "Paid",
  PENDING_CONFIRMATION: "Awaiting confirmation",
  REJECTED: "Rejected",
  BLOCKED: "Blocked",
  FAILED: "On-chain failure",
};

export const REASON_LABEL: Record<ReasonCode, string> = Object.fromEntries(
  Object.entries(COMPLIANCE_RULES).map(([code, rule]) => [code, rule.label_en]),
) as Record<ReasonCode, string>;

export function reasonReferences(code: ReasonCode): string[] {
  return COMPLIANCE_RULES[code]?.references ?? [];
}

export const AUDIT_LABEL: Record<string, string> = {
  DECISION_CREATED: "Decision created",
  DECISION_RESOLVED: "Decision resolved by a human",
  PAYMENT_EXECUTED: "Payment executed",
  PAYMENT_FAILED: "Payment failed",
  POLICY_UPDATED: "Policy updated",
  KILL_SWITCH_ON: "Kill switch activated",
  KILL_SWITCH_OFF: "Kill switch re-armed",
  API_KEY_CREATED: "API key created",
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function formatAvax(value: string): string {
  return formatMoney(value, "AVAX");
}

export function formatMoney(value: string, currency: string = "AVAX"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency}`;
  if (currency === "EUR") return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${currency}`;
}

export const RAIL_LABEL: Record<string, string> = {
  avalanche: "Avalanche · guardian wallet",
  virtual_card: "Single-use virtual card · connected bank account",
};

export const CARD_STATUS_LABEL: Record<string, string> = {
  active: "Active, awaiting merchant charge",
  used: "Used (single use)",
  cancelled: "Cancelled",
  frozen: "Frozen by kill switch",
  expired: "Expired",
};
