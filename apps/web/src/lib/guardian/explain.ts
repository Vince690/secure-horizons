import type { EvaluatePaymentRequest, Reason, Verdict } from "@payguard/shared";

/**
 * Deterministic English explanation built from the reasons. Step 7 adds an
 * LLM version on top (cached); this template stays as the fallback.
 */
export function templateExplanation(verdict: Verdict, score: number, reasons: Reason[], request: EvaluatePaymentRequest): string {
  const merchant = request.recipient.name ?? request.recipient.domain ?? request.recipient.address.slice(0, 10) + "…";
  const head = {
    APPROVED: `Payment of ${request.amount} ${request.currency} to ${merchant} approved (score ${score}/100).`,
    HOLD: `Payment of ${request.amount} ${request.currency} to ${merchant} held for human confirmation (score ${score}/100).`,
    BLOCKED: `Payment of ${request.amount} ${request.currency} to ${merchant} blocked (score ${score}/100).`,
  }[verdict];
  const negatives = reasons.filter((r) => r.delta < 0);
  if (negatives.length === 0) {
    return `${head} Known merchant, amount within policy, explicitly requested by the user.`;
  }
  const top = negatives
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map((r) => r.message.replace(/\.$/, ""))
    .join("; ");
  return `${head} Reasons: ${top}.`;
}
