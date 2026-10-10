import type { Rule } from "../types";
import { medianWei, parseAvax } from "../money";
import { userMessages } from "../text";

const BUDGET_PATTERNS: RegExp[] = [
  /budget (?:de |of )?(\d+(?:[.,]\d+)?) ?avax/i,
  /(?:max|maximum|au maximum|at most|pas plus de|no more than|moins de|under|below) (?:de )?(\d+(?:[.,]\d+)?) ?avax/i,
  /(\d+(?:[.,]\d+)?) ?avax (?:max|maximum|grand max|tops)/i,
];

/** Largest budget the user stated, as wei, or null if none. */
export function statedBudget(text: string): bigint | null {
  let best: bigint | null = null;
  for (const re of BUDGET_PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const value = parseAvax(m[1].replace(",", "."));
    if (best === null || value > best) best = value;
  }
  return best;
}

export const priceAnomaly: Rule = (ctx) => {
  const amount = parseAvax(ctx.request.amount);

  const budget = statedBudget(userMessages(ctx).map((m) => m.content).join("\n"));
  if (budget !== null && amount > budget) {
    return {
      code: "PRICE_ANOMALY",
      severity: "medium",
      delta: -15,
      message: "Le montant dépasse le budget énoncé par l'utilisateur.",
      frameworks: ["MiCA"],
    };
  }

  const past = ctx.history.filter((d) => d.status === "APPROVED").map((d) => parseAvax(d.amount));
  if (past.length >= 3 && amount > medianWei(past) * 3n) {
    return {
      code: "PRICE_ANOMALY",
      severity: "medium",
      delta: -15,
      message: "Le montant est plus de trois fois supérieur aux achats habituels.",
      frameworks: ["MiCA"],
    };
  }
  return null;
};
