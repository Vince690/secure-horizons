import type { Rule } from "../types";
import { normalizeAddress } from "../text";

export const recipientUnknown: Rule = (ctx) => {
  const address = normalizeAddress(ctx.request.recipient.address);
  if (ctx.policy.trusted_recipients.map(normalizeAddress).includes(address)) return null;
  const paidBefore = ctx.history.some(
    (d) => d.status === "APPROVED" && normalizeAddress(d.recipient_address) === address,
  );
  if (paidBefore) return null;
  return {
    code: "RECIPIENT_UNKNOWN",
    severity: "medium",
    delta: -25,
    message: "Bénéficiaire jamais payé auparavant et absent du registre de confiance.",
    frameworks: ["AML_CFT"],
  };
};
