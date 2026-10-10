import type { Reason, SpendingPolicy, Verdict } from "@payguard/shared";
import { parseAvax } from "./money";

/** Any of these alone means BLOCKED, whatever the rest of the score. */
const TERMINAL_CODES = new Set(["KILL_SWITCH_ACTIVE", "RECIPIENT_BLOCKLISTED", "PROMPT_INJECTION_SUSPECTED", "HIDDEN_INSTRUCTIONS"]);

export function computeScore(reasons: Reason[]): number {
  const raw = reasons.reduce((acc, r) => acc + r.delta, 100);
  return Math.max(0, Math.min(100, raw));
}

export function decideVerdict(score: number, reasons: Reason[], policy: SpendingPolicy, amount: string): Verdict {
  if (reasons.some((r) => TERMINAL_CODES.has(r.code))) return "BLOCKED";
  if (score < policy.hold_score) return "BLOCKED";
  if (score < policy.auto_approve_score) return "HOLD";
  // Large amounts always need a human, whatever the score.
  if (parseAvax(amount) > parseAvax(policy.require_confirmation_above)) return "HOLD";
  // First payment to a recipient never paid before: a human confirms, whatever the score.
  if (policy.confirm_new_recipients && reasons.some((r) => r.code === "RECIPIENT_UNKNOWN")) return "HOLD";
  return "APPROVED";
}
