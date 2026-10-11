import { COMPLIANCE_RULES, type DecisionStatus, type Framework, type ReasonCode, type Verdict } from "@payguard/shared";

export const FRAMEWORK_LABEL: Record<Framework, { short: string; long: string }> = {
  DORA: { short: "DORA", long: "Résilience opérationnelle (DORA)" },
  MiCA: { short: "MiCA", long: "Marchés de crypto-actifs (MiCA)" },
  AML_CFT: { short: "AML / CFT", long: "Lutte anti-blanchiment (AML / CFT)" },
  AI_ACT: { short: "AI Act", long: "Règlement sur l'IA (AI Act)" },
};

export const VERDICT_LABEL: Record<Verdict, string> = { APPROVED: "Approuvé", HOLD: "En attente", BLOCKED: "Bloqué" };

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  APPROVED: "Payé",
  PENDING_CONFIRMATION: "À confirmer",
  REJECTED: "Rejeté",
  BLOCKED: "Bloqué",
  FAILED: "Échec on-chain",
};

export const REASON_LABEL: Record<ReasonCode, string> = Object.fromEntries(
  Object.entries(COMPLIANCE_RULES).map(([code, rule]) => [code, rule.label_fr]),
) as Record<ReasonCode, string>;

export function reasonReferences(code: ReasonCode): string[] {
  return COMPLIANCE_RULES[code]?.references ?? [];
}

export const AUDIT_LABEL: Record<string, string> = {
  DECISION_CREATED: "Décision créée",
  DECISION_RESOLVED: "Décision tranchée par un humain",
  PAYMENT_EXECUTED: "Paiement exécuté",
  PAYMENT_FAILED: "Paiement en échec",
  POLICY_UPDATED: "Mandat modifié",
  KILL_SWITCH_ON: "Kill switch activé",
  KILL_SWITCH_OFF: "Kill switch réarmé",
  API_KEY_CREATED: "Clé API créée",
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
  if (currency === "EUR") return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${currency}`;
}

export const RAIL_LABEL: Record<string, string> = {
  avalanche: "Avalanche · wallet gardien",
  virtual_card: "Carte virtuelle à usage unique · compte bancaire",
};

export const CARD_STATUS_LABEL: Record<string, string> = {
  active: "Active, en attente du débit marchand",
  used: "Utilisée (usage unique)",
  cancelled: "Annulée",
  frozen: "Gelée par le kill switch",
  expired: "Expirée",
};
