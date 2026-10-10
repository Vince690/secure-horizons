import type { Evaluation, GuardianContext } from "./types";
import { RULES } from "./rules";
import { summarizeCompliance } from "./compliance";
import { computeScore, decideVerdict } from "./verdict";

/**
 * Pure orchestrator: runs every rule, sums the deltas, derives verdict and
 * compliance. No I/O. Same context => same result, always.
 */
export function evaluate(ctx: GuardianContext): Evaluation {
  const reasons = RULES.map((rule) => rule(ctx)).filter((r) => r !== null);
  const score = computeScore(reasons);
  const verdict = decideVerdict(score, reasons, ctx.policy, ctx.request.amount);
  return { score, verdict, reasons, compliance: summarizeCompliance(reasons) };
}
