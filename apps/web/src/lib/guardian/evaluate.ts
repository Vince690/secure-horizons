import { complianceRule } from "@payguard/shared";
import type { Evaluation, GuardianContext } from "./types";
import { RULES } from "./rules";
import { summarizeCompliance } from "./compliance";
import { computeScore, decideVerdict } from "./verdict";

/**
 * Pure orchestrator: runs every rule, sums the deltas, derives verdict and
 * compliance. No I/O. Same context => same result, always.
 */
export function evaluate(ctx: GuardianContext): Evaluation {
  // Each rule names its frameworks, but the jurist's mapping (compliance.rules.json) has the last word.
  const reasons = RULES.map((rule) => rule(ctx))
    .filter((r) => r !== null)
    .map((r) => ({ ...r, frameworks: complianceRule(r.code).frameworks }));
  const score = computeScore(reasons);
  const verdict = decideVerdict(score, reasons, ctx.policy, ctx.request.amount);
  return { score, verdict, reasons, compliance: summarizeCompliance(reasons) };
}
