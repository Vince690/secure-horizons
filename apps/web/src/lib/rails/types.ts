import type { ChainReference, Currency, Rail, VirtualCardSummary } from "@payguard/shared";

export interface PaymentOrder {
  accountId: string;
  decisionId: string;
  decisionHash: `0x${string}`;
  amount: string;
  currency: Currency;
  recipientAddress: string;
  merchantName: string | null;
  merchantDomain: string | null;
}

export interface PaymentReceipt {
  /** Funds moved on-chain (avalanche rail). */
  paymentTx: ChainReference | null;
  /** Decision anchored on-chain (always, both rails). */
  ledgerTx: ChainReference | null;
  /** Single-use card issued (virtual_card rail). */
  card: VirtualCardSummary | null;
}

/**
 * A rail moves money and always anchors the decision on Avalanche.
 * PayGuard decides, the rail executes, the chain proves.
 */
export interface PaymentRail {
  readonly kind: Rail;
  readonly currency: Currency;
  /** Balance available on this rail, decimal string in `currency`. */
  getBalance(accountId: string): Promise<string>;
  /** Execute an approved payment and anchor it. */
  execute(order: PaymentOrder): Promise<PaymentReceipt>;
  /** Kill switch: stop everything on this rail (pause contract / freeze cards). */
  freeze(accountId: string, active: boolean, reason: string): Promise<ChainReference | null>;
}
