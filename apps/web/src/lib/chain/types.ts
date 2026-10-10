import type { ChainReference } from "@payguard/shared";

/** Verdict codes stored on-chain by PayGuardLedger.record(). pay() implies 0. */
export type OnChainVerdict = 1 | 2 | 3; // 1 = HOLD, 2 = BLOCKED, 3 = REJECTED

/**
 * The only door between the guardian and Avalanche Fuji.
 * Step 1 ships a mock; Dev B's viem implementation replaces it at step 5
 * behind CHAIN_MODE=fuji. Nothing else in apps/web may talk to the chain.
 */
export interface ChainClient {
  /** Wallet balance in AVAX, decimal string. */
  getBalance(): Promise<string>;
  /** PayGuardLedger.pay(): moves funds AND anchors the decision hash. */
  executePayment(decisionId: string, to: `0x${string}`, amountAvax: string, decisionHash: `0x${string}`): Promise<ChainReference>;
  /** PayGuardLedger.record(): anchors a non-payment decision (HOLD / BLOCKED / REJECTED). */
  recordDecision(decisionId: string, verdict: OnChainVerdict, decisionHash: `0x${string}`): Promise<ChainReference>;
  /** activateKillSwitch(reason) / deactivateKillSwitch(). */
  setKillSwitch(active: boolean, reason: string): Promise<ChainReference>;
  isPaused(): Promise<boolean>;
  explorerUrl(txHash: string): string;
}

export class ChainError extends Error {
  readonly code = "CHAIN_ERROR" as const;
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ChainError";
  }
}
