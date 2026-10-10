import type {
  ComplianceSummary,
  EvaluatePaymentRequest,
  Reason,
  SpendingPolicy,
  Verdict,
} from "@payguard/shared";

/** A past decision of the same account, as the engine needs it (no DB types here). */
export interface HistoricalDecision {
  amount: string;
  recipient_address: string;
  recipient_domain?: string;
  purpose: string;
  verdict: Verdict;
  /** APPROVED means funds actually moved. */
  status: string;
  created_at: string; // ISO 8601
}

/**
 * Everything a rule may look at. Built by the API layer (DB + chain),
 * or by tests directly. Rules never fetch anything themselves.
 */
export interface GuardianContext {
  request: EvaluatePaymentRequest;
  policy: SpendingPolicy;
  /** Current wallet balance in AVAX, decimal string. */
  balance: string;
  killSwitchActive: boolean;
  /** Prior decisions of this account, most recent first. */
  history: HistoricalDecision[];
  /** Evaluation time; injected so tests are deterministic. */
  now: Date;
}

/** A rule is a pure function: context in, zero or one Reason out. */
export type Rule = (ctx: GuardianContext) => Reason | null;

export interface Evaluation {
  score: number;
  verdict: Verdict;
  reasons: Reason[];
  compliance: ComplianceSummary;
}
