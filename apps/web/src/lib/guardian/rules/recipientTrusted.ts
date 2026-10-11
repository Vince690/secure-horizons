import type { Rule } from "../types";
import { normalizeAddress } from "../text";

export const recipientTrusted: Rule = (ctx) => {
  const address = normalizeAddress(ctx.request.recipient.address);
  const trusted = ctx.policy.trusted_recipients.map(normalizeAddress);
  if (!trusted.includes(address)) return null;
  return {
    code: "RECIPIENT_TRUSTED",
    severity: "low",
    delta: 0,
    message: "The merchant is in the trust registry.",
    frameworks: ["AML_CFT"],
  };
};
