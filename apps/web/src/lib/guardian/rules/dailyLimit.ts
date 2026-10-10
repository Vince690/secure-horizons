import type { Rule } from "../types";
import { parseAvax, formatAvax } from "../money";

const DAY_MS = 24 * 60 * 60 * 1000;

export const dailyLimit: Rule = (ctx) => {
  const since = ctx.now.getTime() - DAY_MS;
  const spent = ctx.history
    .filter((d) => d.status === "APPROVED" && new Date(d.created_at).getTime() >= since)
    .reduce((acc, d) => acc + parseAvax(d.amount), 0n);
  const total = spent + parseAvax(ctx.request.amount);
  if (total <= parseAvax(ctx.policy.max_daily)) return null;
  return {
    code: "DAILY_LIMIT_EXCEEDED",
    severity: "high",
    delta: -40,
    message: `Cumul sur 24 h de ${formatAvax(total)} AVAX, au-dessus du plafond quotidien (${ctx.policy.max_daily} AVAX).`,
    frameworks: ["AML_CFT"],
  };
};
