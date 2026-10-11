import type { Rule } from "../types";
import { normalizeAddress } from "../text";

export const recipientBlocklisted: Rule = (ctx) => {
  const address = normalizeAddress(ctx.request.recipient.address);
  const blocked = ctx.policy.blocked_recipients.map(normalizeAddress);
  if (!blocked.includes(address)) return null;
  return {
    code: "RECIPIENT_BLOCKLISTED",
    severity: "critical",
    delta: -100,
    message: "The recipient is on the blocked-addresses list.",
    frameworks: ["AML_CFT"],
  };
};
