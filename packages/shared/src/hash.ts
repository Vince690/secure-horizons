import { createHash } from "node:crypto";
import type { Reason, Verdict } from "./types";

export interface DecisionHashInput {
  decision_id: string;
  request_id: string;
  agent_id: string;
  amount: string;
  currency: "AVAX";
  recipient: { address: string };
  purpose: string;
  verdict: Verdict;
  score: number;
  reasons: Pick<Reason, "code">[];
  created_at: string;
}

/**
 * Canonical SHA-256 of a decision, exactly as docs/API.md §6 defines it.
 * Used by the API (to anchor), by the contract client (as bytes32) and by
 * packages/contracts/scripts/verify-decision.ts (to prove integrity).
 */
export function computeDecisionHash(input: DecisionHashInput): string {
  const canonical = JSON.stringify({
    decision_id: input.decision_id,
    request_id: input.request_id,
    agent_id: input.agent_id,
    amount: input.amount,
    currency: input.currency,
    recipient: { address: input.recipient.address.toLowerCase() },
    purpose: input.purpose,
    verdict: input.verdict,
    score: input.score,
    reasons: input.reasons.map((r) => r.code).sort(),
    created_at: input.created_at,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** 0x-prefixed bytes32 form, for the contract. */
export function toBytes32(hexHash: string): `0x${string}` {
  return `0x${hexHash}` as `0x${string}`;
}
