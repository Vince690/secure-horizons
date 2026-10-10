import type { Rule } from "../types";
import { tokens, userMessages } from "../text";

/**
 * Did the human actually ask for this? We look for overlap between what the
 * agent says it is buying (purpose + merchant name) and the user's own words.
 * Without any user message we cannot judge, so the rule stays silent.
 */
export const purposeNotRequested: Rule = (ctx) => {
  const asked = userMessages(ctx).map((m) => m.content).join("\n");
  if (asked.trim().length === 0) return null;
  const askedTokens = new Set(tokens(asked));
  const wanted = tokens(`${ctx.request.purpose} ${ctx.request.recipient.name ?? ""}`);
  if (wanted.length === 0) return null;
  const overlap = wanted.some((t) => askedTokens.has(t));
  if (overlap) return null;
  return {
    code: "PURPOSE_NOT_REQUESTED_BY_USER",
    severity: "high",
    delta: -35,
    message: "Rien dans les messages de l'utilisateur ne correspond à cet achat.",
    frameworks: ["AI_ACT"],
  };
};
