import type { Rule } from "../types";
import { EVM_ADDRESS_RE, hiddenPageBlocks } from "../text";
import { findInjections } from "./promptInjection";

const IMPERATIVE_RE = /\b(call|invoke|send|pay|transfer|execute|ignore|skip|must|validez?|envoie[z]?|paie[z]?|appel(le|ez)|ignore[z]?)\b/i;
const AMOUNT_RE = /\d+(?:[.,]\d+)?\s?AVAX\b/i;

/**
 * Text a human visitor could not see (display:none, white-on-white, HTML
 * comments...) that contains an order, an amount or a wallet address.
 * "The instruction was invisible to the human, visible to the agent."
 * Terminal: see verdict.ts.
 */
export const hiddenInstructions: Rule = (ctx) => {
  const blocks = hiddenPageBlocks(ctx);
  if (blocks.length === 0) return null;
  const suspicious = blocks.filter((b) => {
    const hasAddress = EVM_ADDRESS_RE.test(b.text);
    EVM_ADDRESS_RE.lastIndex = 0;
    return findInjections(b.text).length > 0 || hasAddress || (AMOUNT_RE.test(b.text) && IMPERATIVE_RE.test(b.text));
  });
  if (suspicious.length === 0) return null;
  const techniques = [...new Set(suspicious.map((b) => b.why.replace(/^HIDDEN\s*/, "").replace(/^COMMENT$/, "commentaire HTML")))];
  return {
    code: "HIDDEN_INSTRUCTIONS",
    severity: "critical",
    delta: -50,
    message: `La page contient ${suspicious.length === 1 ? "une instruction invisible" : `${suspicious.length} instructions invisibles`} pour un visiteur humain (${techniques.join(", ")}).`,
    frameworks: ["AI_ACT", "DORA"],
  };
};
