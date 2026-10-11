import type { ChainClient } from "@payguard/shared";
import { getBankAccount, issueCard, setCardsFrozen } from "./sandboxIssuer";
import type { PaymentOrder, PaymentRail, PaymentReceipt } from "./types";

/**
 * "Connect your bank" rail: the money stays on the client's bank account.
 * PayGuard issues a single-use virtual card capped at the exact approved
 * amount, locked to the merchant, and anchors the decision on Avalanche
 * (verdict code 4 = approved on another rail). No funds ever touch PayGuard.
 */
export function createVirtualCardRail(chain: ChainClient): PaymentRail {
  return {
    kind: "virtual_card",
    currency: "EUR",
    getBalance: async (accountId) => (await getBankAccount(accountId)).balance,
    async execute(order: PaymentOrder): Promise<PaymentReceipt> {
      const card = await issueCard({
        accountId: order.accountId,
        decisionId: order.decisionId,
        amount: order.amount,
        merchantLock: order.merchantDomain ?? order.merchantName,
      });
      let ledgerTx = null;
      try {
        ledgerTx = await chain.recordDecision(order.decisionId, 4, order.decisionHash);
      } catch (err) {
        console.error("[rail:card] anchoring failed, card still issued", err);
      }
      return { paymentTx: null, ledgerTx, card };
    },
    async freeze(accountId, active, reason) {
      await setCardsFrozen(accountId, active);
      // The on-chain pause is shared with the Avalanche rail (same contract, same owner).
      return chain.setKillSwitch(active, reason);
    },
  };
}
