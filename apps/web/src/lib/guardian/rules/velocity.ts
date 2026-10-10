import type { Rule } from "../types";

const WINDOW_MS = 10 * 60 * 1000;
/** Prior requests in the window that make the current one the 3rd or more. */
const PRIOR_THRESHOLD = 2;

export const velocity: Rule = (ctx) => {
  const since = ctx.now.getTime() - WINDOW_MS;
  const recent = ctx.history.filter((d) => new Date(d.created_at).getTime() >= since).length;
  if (recent < PRIOR_THRESHOLD) return null;
  return {
    code: "VELOCITY_ANOMALY",
    severity: "medium",
    delta: -20,
    message: `${recent + 1} demandes de paiement en moins de 10 minutes.`,
    frameworks: ["AML_CFT", "DORA"],
  };
};
