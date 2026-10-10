// The ChainClient contract lives in @payguard/shared so that apps/web (mock)
// and packages/contracts (viem) implement exactly the same interface.
export type { AddressInfo, ChainClient, OnChainVerdict } from "@payguard/shared";

export class ChainError extends Error {
  readonly code = "CHAIN_ERROR" as const;
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ChainError";
  }
}
