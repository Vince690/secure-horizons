import type { Rule } from "../types";
import { parseAvax } from "../money";

export const minBalance: Rule = (ctx) => {
  const after = parseAvax(ctx.balance) - parseAvax(ctx.request.amount);
  if (after >= parseAvax(ctx.policy.min_balance)) return null;
  return {
    code: "MIN_BALANCE_BREACH",
    severity: "high",
    delta: -50,
    message: `Ce paiement ferait passer le solde sous le plancher de ${ctx.policy.min_balance} ${ctx.request.currency}.`,
    frameworks: ["MiCA"],
  };
};
