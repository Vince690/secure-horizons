import type { Rule } from "../types";
import { domainLabel, homoglyphNormalize, levenshtein } from "../text";

export const domainLookalike: Rule = (ctx) => {
  const domain = ctx.request.recipient.domain?.toLowerCase().replace(/^www\./, "");
  if (!domain) return null;
  const references = new Set<string>([
    ...ctx.policy.trusted_domains.map((d) => d.toLowerCase().replace(/^www\./, "")),
    ...ctx.history
      .filter((d) => d.status === "APPROVED" && d.recipient_domain)
      .map((d) => d.recipient_domain!.toLowerCase().replace(/^www\./, "")),
  ]);
  if (references.has(domain)) return null;

  const label = domainLabel(domain);
  const normalized = homoglyphNormalize(label);
  for (const ref of references) {
    const refLabel = domainLabel(ref);
    const refNormalized = homoglyphNormalize(refLabel);
    const sameAfterHomoglyphs = normalized === refNormalized;
    const close = levenshtein(label, refLabel) <= 2;
    const prefixed = normalized.startsWith(refNormalized) && normalized.length <= refNormalized.length + 8;
    if (sameAfterHomoglyphs || close || prefixed) {
      return {
        code: "DOMAIN_LOOKALIKE",
        severity: "high",
        delta: -30,
        message: `Le domaine ${domain} imite un marchand de confiance (${ref}).`,
        frameworks: ["AML_CFT"],
      };
    }
  }
  return null;
};
