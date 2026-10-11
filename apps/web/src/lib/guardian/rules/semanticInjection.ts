import type { Rule } from "../types";

const MIN_CONFIDENCE = 0.6;

/**
 * The model's second opinion on the page (src/lib/llm/semantic.ts), injected
 * into the context by the service. Pure rule: it only reads ctx.semanticScreen.
 * Not terminal on purpose: a model opinion adds points, it never decides alone.
 */
export const semanticInjection: Rule = (ctx) => {
  const screen = ctx.semanticScreen;
  if (!screen || !screen.manipulation || screen.confidence < MIN_CONFIDENCE) return null;
  return {
    code: "SEMANTIC_MANIPULATION_SUSPECTED",
    severity: "high",
    delta: -40,
    message: screen.summary
      ? `Semantic analysis: ${screen.summary.replace(/\.$/, "")} (confidence ${Math.round(screen.confidence * 100)}%).`
      : `Semantic analysis: the page appears to be attempting to manipulate the agent (confidence ${Math.round(screen.confidence * 100)}%).`,
    frameworks: ["AI_ACT", "DORA"],
  };
};
