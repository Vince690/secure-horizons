import type { Rule } from "../types";
import { EVM_ADDRESS_RE, normalizeAddress, visiblePageText } from "../text";

/**
 * The page visibly shows payment address(es) and the agent wants to pay
 * somewhere else: the address came from a hidden notice, a tool result,
 * or the agent's own confusion. Either way, not what the human saw.
 */
export const pageAddressMismatch: Rule = (ctx) => {
  const shown = new Set((visiblePageText(ctx).match(EVM_ADDRESS_RE) ?? []).map(normalizeAddress));
  if (shown.size === 0) return null;
  if (shown.has(normalizeAddress(ctx.request.recipient.address))) return null;
  return {
    code: "PAGE_ADDRESS_MISMATCH",
    severity: "high",
    delta: -35,
    message: "L'adresse demandée n'est pas celle affichée sur la page du marchand.",
    frameworks: ["AML_CFT", "AI_ACT"],
  };
};
