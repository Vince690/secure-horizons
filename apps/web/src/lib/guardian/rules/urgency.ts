import type { Rule } from "../types";
import { untrustedText } from "../text";

const URGENCY_PATTERNS: RegExp[] = [
  /\burgent(e|ly)?\b/i,
  /\bimm[ée]diat(ement|ely)?\b/i,
  /\b(derni[èe]re|last) chance\b/i,
  /\b(expires?|expire) (in|dans) \d+/i,
  /\b(right )?now\b/i,
  /\bact (fast|quickly)\b/i,
  /\boffre (limit[ée]e|expire)\b/i,
];

/** Pressure in the page or tool output, not in the user's own words. */
export const urgency: Rule = (ctx) => {
  const text = untrustedText(ctx);
  if (!URGENCY_PATTERNS.some((re) => re.test(text))) return null;
  return {
    code: "URGENCY_LANGUAGE",
    severity: "low",
    delta: -10,
    message: "La page ou un outil utilise un langage de pression (urgence, délai).",
    frameworks: ["AML_CFT"],
  };
};
