import type { Rule } from "../types";
import { formatAvax, parseAvax } from "../money";
import { pricesIn, visiblePageText } from "../text";

/** 5 % tolerance for rounding / fees shown separately. */
const TOLERANCE_NUM = 105n;
const TOLERANCE_DEN = 100n;

/**
 * The agent asks for more than any price a human could see on the page.
 * In the demo: page says 0.04 AVAX, hidden notice says 0.5, agent asks 0.5.
 */
export const pagePriceMismatch: Rule = (ctx) => {
  const prices = pricesIn(visiblePageText(ctx), ctx.request.currency);
  if (prices.length === 0) return null;
  const maxVisible = prices.reduce((a, b) => (a > b ? a : b));
  const amount = parseAvax(ctx.request.amount);
  if (amount * TOLERANCE_DEN <= maxVisible * TOLERANCE_NUM) return null;
  return {
    code: "PAGE_PRICE_MISMATCH",
    severity: "high",
    delta: -35,
    message: `La page affiche au plus ${formatAvax(maxVisible)} ${ctx.request.currency}, l'agent demande ${ctx.request.amount} ${ctx.request.currency}.`,
    frameworks: ["MiCA", "AI_ACT"],
  };
};
