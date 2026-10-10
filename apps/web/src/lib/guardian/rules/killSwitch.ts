import type { Rule } from "../types";

export const killSwitch: Rule = (ctx) => {
  if (!ctx.killSwitchActive) return null;
  return {
    code: "KILL_SWITCH_ACTIVE",
    severity: "critical",
    delta: -100,
    message: "Le kill switch est actif : tous les paiements sont suspendus par le titulaire du compte.",
    frameworks: ["DORA", "AI_ACT"],
  };
};
