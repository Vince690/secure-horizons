/**
 * PayGuard shared contract — single source of truth for every team member.
 * The API (apps/web), the MCP server (apps/mcp-server), the chain client
 * (packages/contracts) and the demo agent all import these types.
 *
 * Rule: if you need to change a field, change it HERE first, commit, and tell
 * the team in the group chat. Do not fork these shapes locally.
 */

// ---------------------------------------------------------------------------
// Verdicts, scores, compliance
// ---------------------------------------------------------------------------

/** Final decision of the guardian for one payment request. */
export type Verdict = "APPROVED" | "HOLD" | "BLOCKED";

/** Lifecycle of a decision. HOLD starts PENDING_CONFIRMATION and ends APPROVED or REJECTED. */
export type DecisionStatus =
  | "APPROVED" // executed on-chain (tx hash present)
  | "PENDING_CONFIRMATION" // waiting for a human on the dashboard
  | "REJECTED" // human rejected a HOLD
  | "BLOCKED" // guardian refused outright
  | "FAILED"; // approved but on-chain execution failed

export type Severity = "low" | "medium" | "high" | "critical";

/** Regulatory frameworks shown on the dashboard and in the pitch. */
export type Framework = "DORA" | "MiCA" | "AML_CFT" | "AI_ACT";

export type ComplianceState = "ok" | "warn" | "fail";

export type ComplianceSummary = Record<Framework, ComplianceState>;

/**
 * Every rule that fires produces one Reason. Codes are stable identifiers used
 * by the dashboard (icons, French labels) and by the jurist's mapping table
 * (docs/COMPLIANCE.md). Add new codes at the end, never rename.
 */
export type ReasonCode =
  | "KILL_SWITCH_ACTIVE"
  | "AMOUNT_OVER_TX_LIMIT"
  | "DAILY_LIMIT_EXCEEDED"
  | "MIN_BALANCE_BREACH"
  | "RECIPIENT_UNKNOWN"
  | "RECIPIENT_BLOCKLISTED"
  | "RECIPIENT_TRUSTED"
  | "DOMAIN_LOOKALIKE"
  | "PROMPT_INJECTION_SUSPECTED"
  | "URGENCY_LANGUAGE"
  | "VELOCITY_ANOMALY"
  | "PRICE_ANOMALY"
  | "PURPOSE_NOT_REQUESTED_BY_USER"
  | "RECIPIENT_CHANGED_MID_CONVERSATION"
  // Page / request consistency (added at step 4)
  | "HIDDEN_INSTRUCTIONS"
  | "PAGE_PRICE_MISMATCH"
  | "PAGE_ADDRESS_MISMATCH"
  | "PAGE_PRODUCT_MISMATCH";

export interface Reason {
  code: ReasonCode;
  severity: Severity;
  /** Points removed from (or added to) the 100 base score. Negative = penalty. */
  delta: number;
  /** Short French sentence for the dashboard and the agent. */
  message: string;
  /** Frameworks this rule protects. Filled from docs/COMPLIANCE.md. */
  frameworks: Framework[];
}

// ---------------------------------------------------------------------------
// Payment evaluation (the core endpoint)
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  role: "user" | "assistant" | "tool";
  content: string;
}

export interface Recipient {
  /** EVM address on Fuji, 0x-prefixed, 40 hex chars. */
  address: string;
  /** Merchant name as displayed to the agent. */
  name?: string;
  /** Merchant domain as seen by the agent (used for lookalike detection). */
  domain?: string;
}

/** Body of POST /api/v1/payments/evaluate */
export interface EvaluatePaymentRequest {
  /** Stable identifier of the calling agent, e.g. "claude-desktop". */
  agent_id: string;
  /** Idempotency key chosen by the caller (UUID). Same key => same decision. */
  request_id: string;
  /** Decimal string in AVAX, e.g. "0.05". Strings avoid float issues. */
  amount: string;
  currency: "AVAX";
  recipient: Recipient;
  /** What the agent believes it is buying, in its own words. */
  purpose: string;
  context?: {
    page_url?: string;
    /** Raw text the agent read on the merchant page (max 4000 chars). */
    page_excerpt?: string;
    /** Last N messages of the conversation that led to this request. */
    conversation?: ConversationMessage[];
  };
}

export interface ChainReference {
  tx_hash: string;
  explorer_url: string;
  block_number?: number;
}

/** Response of POST /api/v1/payments/evaluate and GET /api/v1/payments/:id */
export interface Decision {
  decision_id: string;
  request_id: string;
  agent_id: string;
  verdict: Verdict;
  status: DecisionStatus;
  /** Trust score 0-100. 100 = nothing suspicious. */
  score: number;
  reasons: Reason[];
  compliance: ComplianceSummary;
  /** French explanation written for a non-technical reader (LLM, cached). */
  explanation: string;
  amount: string;
  currency: "AVAX";
  recipient: Recipient;
  purpose: string;
  /** Present when funds actually moved on Fuji. */
  payment_tx: ChainReference | null;
  /** Present when the decision was anchored on-chain (approved OR blocked). */
  ledger_tx: ChainReference | null;
  /** SHA-256 of the canonical decision payload, also stored on-chain. */
  decision_hash: string;
  created_at: string; // ISO 8601
  resolved_at: string | null;
  resolved_by: "guardian" | "human" | null;
  /** Relative URL the agent can poll while status is PENDING_CONFIRMATION. */
  status_url: string;
}

// ---------------------------------------------------------------------------
// Policy & account
// ---------------------------------------------------------------------------

/** Spending policy configured by the human on the dashboard. */
export interface SpendingPolicy {
  /** Max amount per single transaction, AVAX decimal string. */
  max_per_tx: string;
  /** Max cumulative amount per rolling 24h. */
  max_daily: string;
  /** The wallet must never go below this balance after a payment. */
  min_balance: string;
  /** score >= auto_approve_score => APPROVED. Default 70. */
  auto_approve_score: number;
  /** hold_score <= score < auto_approve_score => HOLD. score < hold_score => BLOCKED. Default 40. */
  hold_score: number;
  /** Any amount above this always requires human confirmation, whatever the score. */
  require_confirmation_above: string;
  /** Addresses (lowercase) the human has explicitly trusted. */
  trusted_recipients: string[];
  /** Addresses (lowercase) that are always blocked. */
  blocked_recipients: string[];
  /** Domains the human has explicitly trusted (used for lookalike detection). */
  trusted_domains: string[];
}

export interface KillSwitchState {
  active: boolean;
  reason: string | null;
  activated_at: string | null;
  /** On-chain pause() tx on PayGuardLedger. */
  onchain_tx: ChainReference | null;
}

export interface BalanceResponse {
  address: string;
  balance: string; // AVAX decimal string
  chain_id: 43113;
  explorer_url: string;
}

// ---------------------------------------------------------------------------
// Audit log (internal file + DB, hash-chained)
// ---------------------------------------------------------------------------

export type AuditEventType =
  | "DECISION_CREATED"
  | "DECISION_RESOLVED"
  | "PAYMENT_EXECUTED"
  | "PAYMENT_FAILED"
  | "POLICY_UPDATED"
  | "KILL_SWITCH_ON"
  | "KILL_SWITCH_OFF"
  | "API_KEY_CREATED";

export interface AuditEntry {
  seq: number;
  event: AuditEventType;
  account_id: string;
  payload: unknown;
  prev_hash: string; // "0".repeat(64) for the first entry
  hash: string; // sha256(seq + event + account_id + JSON(payload) + prev_hash)
  created_at: string;
}

// ---------------------------------------------------------------------------
// Standard error envelope
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code:
      | "UNAUTHORIZED"
      | "INVALID_REQUEST"
      | "KILL_SWITCH_ACTIVE"
      | "NOT_FOUND"
      | "CHAIN_ERROR"
      | "INTERNAL";
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Defaults used by seeds and tests
// ---------------------------------------------------------------------------

export const DEFAULT_POLICY: SpendingPolicy = {
  max_per_tx: "0.1",
  max_daily: "0.3",
  min_balance: "0.5",
  auto_approve_score: 70,
  hold_score: 40,
  require_confirmation_above: "0.08",
  trusted_recipients: [],
  blocked_recipients: [],
  trusted_domains: [],
};

export const FUJI_CHAIN_ID = 43113 as const;
