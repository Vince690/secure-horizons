import type { Rule } from "../types";
import { EVM_ADDRESS_RE, normalizeAddress, untrustedText } from "../text";

/**
 * Another wallet address shows up in the page or the tool/assistant turns.
 * Classic "our bank details have changed" fraud, agent edition.
 */
export const recipientChanged: Rule = (ctx) => {
  const target = normalizeAddress(ctx.request.recipient.address);
  const seen = new Set((untrustedText(ctx).match(EVM_ADDRESS_RE) ?? []).map(normalizeAddress));
  seen.delete(target);
  if (seen.size === 0) return null;
  return {
    code: "RECIPIENT_CHANGED_MID_CONVERSATION",
    severity: "high",
    delta: -35,
    message: "Une autre adresse de paiement apparaît dans la page ou la conversation.",
    frameworks: ["AML_CFT"],
  };
};
