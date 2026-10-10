import type { Rule } from "../types";
import { parseAvax } from "../money";

export const amountOverTxLimit: Rule = (ctx) => {
  if (parseAvax(ctx.request.amount) <= parseAvax(ctx.policy.max_per_tx)) return null;
  return {
    code: "AMOUNT_OVER_TX_LIMIT",
    severity: "high",
    delta: -40,
    message: `Montant ${ctx.request.amount} AVAX supérieur au plafond par achat (${ctx.policy.max_per_tx} AVAX).`,
    frameworks: ["MiCA", "AML_CFT"],
  };
};
