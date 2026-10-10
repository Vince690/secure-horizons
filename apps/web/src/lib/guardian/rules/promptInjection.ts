import type { Rule } from "../types";
import { untrustedText } from "../text";

/**
 * Patterns typical of instructions smuggled into a page or a tool result.
 * Deterministic on purpose: the demo must give the same verdict every time.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any )?(previous|prior|above|earlier) (instructions|messages|rules)/i,
  /\bsystem (notice|prompt|message|override|instruction)\b/i,
  /\b(notice|instructions?|message) (to|for) (the )?(ai|llm|assistant|agent)s?\b/i,
  /\bdo not (tell|mention|inform|reveal|disclose)( this| it)? (to )?(the )?user\b/i,
  /\b(without|don'?t) (telling|informing|notifying) (the )?user\b/i,
  /\b(payment|wallet|receiving) address (above|below|listed|shown)? ?(is|has been|was) (outdated|changed|updated|replaced|moved)\b/i,
  /\b(immediately|now) (call|invoke|use|execute) (the )?(request_payment|payment tool|tool)\b/i,
  /\bsend \d+(\.\d+)? ?avax to 0x[a-f0-9]{40}\b/i,
  /\b(you must|you are required to|it is mandatory to) (send|pay|transfer)\b/i,
  /\bne (le )?(dis|mentionne|signale) pas (à|a) l'utilisateur\b/i,
  /\bignore (les|toutes les) (instructions|consignes) (précédentes|precedentes|antérieures)\b/i,
];

export const promptInjection: Rule = (ctx) => {
  const text = untrustedText(ctx);
  if (text.trim().length === 0) return null;
  const hits = INJECTION_PATTERNS.filter((re) => re.test(text));
  if (hits.length === 0) return null;
  return {
    code: "PROMPT_INJECTION_SUSPECTED",
    severity: "critical",
    delta: -40,
    message:
      hits.length === 1
        ? "La page ou un résultat d'outil contient une instruction destinée à manipuler l'agent."
        : `La page ou un résultat d'outil contient ${hits.length} instructions destinées à manipuler l'agent.`,
    frameworks: ["AI_ACT", "DORA"],
  };
};
