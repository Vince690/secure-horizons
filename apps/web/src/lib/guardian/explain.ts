import type { EvaluatePaymentRequest, Reason, Verdict } from "@payguard/shared";

/**
 * Deterministic French explanation built from the reasons. Step 7 adds an
 * LLM version on top (cached); this template stays as the fallback.
 */
export function templateExplanation(verdict: Verdict, score: number, reasons: Reason[], request: EvaluatePaymentRequest): string {
  const merchant = request.recipient.name ?? request.recipient.domain ?? request.recipient.address.slice(0, 10) + "…";
  const head = {
    APPROVED: `Paiement de ${request.amount} AVAX à ${merchant} autorisé (score ${score}/100).`,
    HOLD: `Paiement de ${request.amount} AVAX à ${merchant} mis en attente d'une validation humaine (score ${score}/100).`,
    BLOCKED: `Paiement de ${request.amount} AVAX à ${merchant} refusé (score ${score}/100).`,
  }[verdict];
  const negatives = reasons.filter((r) => r.delta < 0);
  if (negatives.length === 0) {
    return `${head} Marchand connu, montant dans le mandat, demande explicite de l'utilisateur.`;
  }
  const top = negatives
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map((r) => r.message.replace(/\.$/, ""))
    .join(" ; ");
  return `${head} Motifs : ${top}.`;
}
