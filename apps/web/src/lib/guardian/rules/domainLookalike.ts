import type { Rule } from "../types";
import { findLookalike } from "../text";

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
  const imitated = findLookalike(domain, references);
  if (!imitated) return null;
  return {
    code: "DOMAIN_LOOKALIKE",
    severity: "high",
    delta: -30,
    message: `Le domaine ${domain} imite un marchand de confiance (${imitated}).`,
    frameworks: ["AML_CFT"],
  };
};
