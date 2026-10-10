import type { ComplianceState, ComplianceSummary, Framework, Reason } from "@payguard/shared";

const FRAMEWORKS: Framework[] = ["DORA", "MiCA", "AML_CFT", "AI_ACT"];

/**
 * fail  = a high/critical penalty cites the framework
 * warn  = only low/medium penalties cite it
 * ok    = nothing negative cites it
 */
export function summarizeCompliance(reasons: Reason[]): ComplianceSummary {
  const summary = {} as ComplianceSummary;
  for (const framework of FRAMEWORKS) {
    let state: ComplianceState = "ok";
    for (const reason of reasons) {
      if (reason.delta >= 0 || !reason.frameworks.includes(framework)) continue;
      if (reason.severity === "high" || reason.severity === "critical") {
        state = "fail";
        break;
      }
      state = "warn";
    }
    summary[framework] = state;
  }
  return summary;
}
