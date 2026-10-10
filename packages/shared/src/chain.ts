import type { ChainReference } from "./types";

/** Verdict codes stored on-chain by PayGuardLedger.record(). pay() implies 0 (APPROVED). */
export type OnChainVerdict = 1 | 2 | 3; // 1 = HOLD, 2 = BLOCKED, 3 = REJECTED

export interface AddressInfo {
  address: string;
  /** Number of transactions sent from this address (nonce). */
  tx_count: number;
  /** AVAX decimal string. */
  balance: string;
  is_contract: boolean;
}

/**
 * The only door between the guardian and Avalanche Fuji.
 * apps/web ships an in-memory mock; packages/contracts/client ships the viem
 * implementation, selected by CHAIN_MODE=mock|fuji.
 */
export interface ChainClient {
  /** Public address of the guardian wallet (the account that owns the contract). */
  walletAddress(): string;
  /** Guardian wallet balance in AVAX, decimal string. */
  getBalance(): Promise<string>;
  /** On-chain facts about any address, used for recipient reputation. */
  getAddressInfo(address: string): Promise<AddressInfo>;
  /** PayGuardLedger.pay(): moves funds AND anchors the decision hash. */
  executePayment(decisionId: string, to: `0x${string}`, amountAvax: string, decisionHash: `0x${string}`): Promise<ChainReference>;
  /** PayGuardLedger.record(): anchors a non-payment decision (HOLD / BLOCKED / REJECTED). */
  recordDecision(decisionId: string, verdict: OnChainVerdict, decisionHash: `0x${string}`): Promise<ChainReference>;
  /** activateKillSwitch(reason) / deactivateKillSwitch(). */
  setKillSwitch(active: boolean, reason: string): Promise<ChainReference>;
  isPaused(): Promise<boolean>;
  explorerUrl(txHash: string): string;
}
