import type { Rule } from "../types";

export const killSwitch: Rule = (ctx) => {
  if (!ctx.killSwitchActive) return null;
  return {
    code: "KILL_SWITCH_ACTIVE",
    severity: "critical",
    delta: -100,
    message: "The kill switch is active: all payments are suspended by the account owner.",
    frameworks: ["DORA", "AI_ACT"],
  };
};
