// Explicit named re-exports on purpose: the ESM apps (mcp-server, demo-agent)
// load this package through tsx as CommonJS, and Node only detects named
// exports it can see statically. `export * from` would hide them.
export type {
  Verdict, DecisionStatus, Severity, Framework, ComplianceState, ComplianceSummary, ReasonCode, Reason,
  ConversationMessage, Recipient, EvaluatePaymentRequest, ChainReference, Decision, SpendingPolicy, RailLimits,
  KillSwitchState, BalanceResponse, AuditEventType, AuditEntry, ApiError, Rail, Currency, VirtualCardStatus, VirtualCardSummary,
} from "./types";
export { DEFAULT_POLICY, FUJI_CHAIN_ID, RAIL_CURRENCY } from "./types";
export type { DecisionHashInput } from "./hash";
export { computeDecisionHash, toBytes32 } from "./hash";
export type { OnChainVerdict, AddressInfo, ChainClient } from "./chain";
export type { ComplianceRule } from "./compliance";
export { COMPLIANCE_RULES, complianceRule } from "./compliance";
export {
  EVM_ADDRESS_RE, HIDDEN_BLOCK_RE, normalizeAddress, tokens, levenshtein, homoglyphNormalize, domainLabel,
  findLookalike, visibleText, hiddenBlocks, KNOWN_BRANDS,
} from "./text";
export type { InjectionMatch } from "./injection";
export { INJECTION_PATTERNS, findInjections } from "./injection";
