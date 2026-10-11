import type { Rule } from "../types";
import { homoglyphNormalize, tokens, visiblePageText } from "../text";

const MIN_PAGE_TOKENS = 15;

/**
 * What the agent says it is buying does not appear anywhere on the page it
 * read. Only fires on pages with enough text to judge.
 */
export const pageProductMismatch: Rule = (ctx) => {
  // Homoglyphs collapsed on both sides so "N0rdSound" still matches "NordSound":
  // the lookalike rule handles the imitation, this rule only checks the product.
  const pageTokens = new Set(tokens(visiblePageText(ctx)).map(homoglyphNormalize));
  if (pageTokens.size < MIN_PAGE_TOKENS) return null;
  // Purpose only: the merchant name is on its own page by definition.
  const wanted = tokens(ctx.request.purpose).map(homoglyphNormalize);
  if (wanted.length === 0) return null;
  if (wanted.some((t) => pageTokens.has(t))) return null;
  return {
    code: "PAGE_PRODUCT_MISMATCH",
    severity: "medium",
    delta: -20,
    message: "The product stated by the agent does not appear on the page it read.",
    frameworks: ["AI_ACT"],
  };
};
