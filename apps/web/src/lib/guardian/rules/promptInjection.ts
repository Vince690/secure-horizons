import { findInjections } from "@payguard/shared";
import type { Rule } from "../types";
import { untrustedText } from "../text";

export { findInjections, INJECTION_PATTERNS } from "@payguard/shared";
export type { InjectionMatch } from "@payguard/shared";

/**
 * Team decision (2026-10-10): a page that gives orders to the agent has no
 * legitimate reason to exist, so this rule is TERMINAL: the verdict is always
 * BLOCKED (see verdict.ts), and the -70 keeps the score honest about it.
 * Patterns live in @payguard/shared/injection.ts. Only text the agent got
 * from the outside world is scanned (page + tool/assistant turns), never the
 * user's own messages.
 */
export const promptInjection: Rule = (ctx) => {
  const text = untrustedText(ctx);
  if (text.trim().length === 0) return null;
  const hits = findInjections(text);
  if (hits.length === 0) return null;
  const families = [...new Set(hits.map((h) => h.family))];
  return {
    code: "PROMPT_INJECTION_SUSPECTED",
    severity: "critical",
    delta: -70,
    message:
      hits.length === 1
        ? "La page ou un résultat d'outil contient une instruction destinée à manipuler l'agent."
        : `La page ou un résultat d'outil contient ${hits.length} instructions destinées à manipuler l'agent (${families.join(", ")}).`,
    frameworks: ["AI_ACT", "DORA"],
  };
};
