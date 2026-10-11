import type { Rule } from "../types";
import { normalizeAddress } from "../text";

/**
 * On-chain reputation, the cheap version: an address that has never sent a
 * transaction and holds nothing is brand new. Fraud wallets usually are.
 * Silent for trusted recipients and when the chain gave us no data.
 */
export const recipientNoOnchainHistory: Rule = (ctx) => {
  const info = ctx.recipientInfo;
  if (!info) return null;
  const address = normalizeAddress(ctx.request.recipient.address);
  if (ctx.policy.trusted_recipients.map(normalizeAddress).includes(address)) return null;
  const empty = info.tx_count === 0 && /^0(\.0+)?$/.test(info.balance);
  if (!empty) return null;
  return {
    code: "RECIPIENT_NO_ONCHAIN_HISTORY",
    severity: "medium",
    delta: -15,
    message: "The recipient address has no on-chain history on Avalanche (never used, zero balance).",
    frameworks: ["AML_CFT"],
  };
};
