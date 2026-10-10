import rules from "./compliance.rules.json";
import type { Framework, ReasonCode } from "./types";

export interface ComplianceRule {
  frameworks: Framework[];
  label_fr: string;
  short_fr: string;
  references: string[];
}

type RulesFile = Record<string, ComplianceRule | string>;

/** The jurist's mapping, typed. Unknown codes fall back to an empty entry. */
export const COMPLIANCE_RULES: Record<ReasonCode, ComplianceRule> = Object.fromEntries(
  Object.entries(rules as RulesFile).filter(([k, v]) => k !== "_comment" && typeof v === "object"),
) as Record<ReasonCode, ComplianceRule>;

export function complianceRule(code: ReasonCode): ComplianceRule {
  return COMPLIANCE_RULES[code] ?? { frameworks: [], label_fr: code, short_fr: "", references: [] };
}
