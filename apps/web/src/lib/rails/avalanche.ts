import type { ChainClient } from "@payguard/shared";
import type { PaymentOrder, PaymentRail, PaymentReceipt } from "./types";

/** The original rail: pay() moves AVAX and anchors the hash in one transaction. */
export function createAvalancheRail(chain: ChainClient): PaymentRail {
  return {
    kind: "avalanche",
    currency: "AVAX",
    getBalance: () => chain.getBalance(),
    async execute(order: PaymentOrder): Promise<PaymentReceipt> {
      const tx = await chain.executePayment(order.decisionId, order.recipientAddress as `0x${string}`, order.amount, order.decisionHash);
      return { paymentTx: tx, ledgerTx: tx, card: null };
    },
    freeze: (_accountId, active, reason) => chain.setKillSwitch(active, reason),
  };
}
