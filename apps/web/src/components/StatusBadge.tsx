import type { DecisionStatus } from "@payguard/shared";
import { STATUS_LABEL } from "./labels";

const STYLE: Record<DecisionStatus, string> = {
  APPROVED: "bg-ok/15 text-ok border-ok/40",
  PENDING_CONFIRMATION: "bg-warn/15 text-warn border-warn/40",
  REJECTED: "bg-crit/15 text-crit border-crit/40",
  BLOCKED: "bg-crit/15 text-crit border-crit/40",
  FAILED: "bg-surface-2 text-muted border-line",
};

export function StatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
