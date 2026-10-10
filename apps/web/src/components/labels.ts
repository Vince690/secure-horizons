import type { DecisionStatus, Framework, ReasonCode, Verdict } from "@payguard/shared";

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

export const REASON_LABEL: Record<ReasonCode, string> = {
  KILL_SWITCH_ACTIVE: "Kill switch actif",
  AMOUNT_OVER_TX_LIMIT: "Plafond par achat dépassé",
  DAILY_LIMIT_EXCEEDED: "Plafond quotidien dépassé",
  MIN_BALANCE_BREACH: "Solde plancher menacé",
  RECIPIENT_UNKNOWN: "Bénéficiaire inconnu",
  RECIPIENT_BLOCKLISTED: "Bénéficiaire interdit",
  RECIPIENT_TRUSTED: "Marchand de confiance",
  DOMAIN_LOOKALIKE: "Domaine imitant",
  PROMPT_INJECTION_SUSPECTED: "Injection de prompt",
  URGENCY_LANGUAGE: "Langage de pression",
  VELOCITY_ANOMALY: "Rafale de demandes",
  PRICE_ANOMALY: "Prix anormal",
  PURPOSE_NOT_REQUESTED_BY_USER: "Achat non demandé",
  RECIPIENT_CHANGED_MID_CONVERSATION: "Adresse changée en cours de route",
  HIDDEN_INSTRUCTIONS: "Instructions invisibles",
  PAGE_PRICE_MISMATCH: "Prix différent de la page",
  PAGE_ADDRESS_MISMATCH: "Adresse différente de la page",
  PAGE_PRODUCT_MISMATCH: "Produit absent de la page",
  RECIPIENT_NO_ONCHAIN_HISTORY: "Adresse sans historique on-chain",
  SEMANTIC_MANIPULATION_SUSPECTED: "Manipulation détectée par analyse sémantique",
};

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
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} AVAX` : `${value} AVAX`;
}
