import type { ReactNode } from "react";
import Link from "next/link";
import type { ComplianceState, DecisionStatus, Reason, Verdict } from "@payguard/shared";
import { Chip } from "./base/badges/chip";
import { REASON_LABEL, reasonReferences, STATUS_LABEL, VERDICT_LABEL } from "./labels";

export function Card({ title, children, className = "", action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type ChipIcon = (props: { className?: string }) => ReactNode;

/** Simple monotone (currentColor) glyphs — no icon library, kept tiny on purpose. */
const CheckIcon: ChipIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
const ClockIcon: ChipIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.2l2.2 1.3" />
  </svg>
);
const AlertIcon: ChipIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2.5l6 10.5H2z" />
    <path d="M8 6.5v3" />
    <circle cx="8" cy="11.4" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
const BlockedIcon: ChipIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M4.5 4.5l7 7" />
  </svg>
);

const VERDICT_CHIP_COLOR: Record<Verdict, "lime" | "yellow" | "rose"> = {
  APPROVED: "lime",
  HOLD: "yellow",
  BLOCKED: "rose",
};
const VERDICT_CHIP_ICON: Record<Verdict, ChipIcon> = {
  APPROVED: CheckIcon,
  HOLD: ClockIcon,
  BLOCKED: BlockedIcon,
};

/** The pill shows the FINAL state: a HOLD approved by a human reads "Paid (human)", not "On hold". */
export function VerdictPill({ verdict, status }: { verdict: Verdict; status?: DecisionStatus }) {
  let label = VERDICT_LABEL[verdict];
  let color = VERDICT_CHIP_COLOR[verdict];
  let Icon = VERDICT_CHIP_ICON[verdict];
  if (status === "APPROVED") {
    label = verdict === "HOLD" ? "Paid (human)" : "Approved";
    color = VERDICT_CHIP_COLOR.APPROVED;
    Icon = CheckIcon;
  } else if (status === "REJECTED") {
    label = "Rejected (human)";
    color = VERDICT_CHIP_COLOR.BLOCKED;
    Icon = BlockedIcon;
  } else if (status === "PENDING_CONFIRMATION") {
    label = STATUS_LABEL.PENDING_CONFIRMATION;
    color = VERDICT_CHIP_COLOR.HOLD;
    Icon = ClockIcon;
  } else if (status === "FAILED") {
    label = STATUS_LABEL.FAILED;
    color = VERDICT_CHIP_COLOR.HOLD;
    Icon = AlertIcon;
  } else if (status === "BLOCKED") {
    label = VERDICT_LABEL.BLOCKED;
    color = VERDICT_CHIP_COLOR.BLOCKED;
    Icon = BlockedIcon;
  }
  return (
    <Chip color={color} variant="bold" className="gap-1">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Chip>
  );
}

export function scoreColor(score: number): string {
  return score >= 70 ? "text-ok" : score >= 40 ? "text-warn" : "text-crit";
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "md" | "xl" }) {
  const cls = size === "xl" ? "text-6xl" : "text-2xl";
  return (
    <span className={`tabular font-bold ${cls} ${scoreColor(score)}`}>
      {score}
      <span className="text-base font-normal text-muted">/100</span>
    </span>
  );
}

const STATE_STYLE: Record<ComplianceState, { ring: string; dot: string; label: string }> = {
  ok: { ring: "border-ok/40", dot: "bg-ok", label: "Compliant" },
  warn: { ring: "border-warn/60", dot: "bg-warn", label: "Warning" },
  fail: { ring: "border-crit/60", dot: "bg-crit", label: "Alert" },
};

export function FrameworkTile({ name, long, state, detail }: { name: string; long: string; state: ComplianceState; detail?: string }) {
  const s = STATE_STYLE[state];
  return (
    <div className={`rounded-xl border-2 bg-surface-2 p-4 ${s.ring}`}>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{name}</span>
        <span className={`h-3 w-3 rounded-full ${s.dot}`} />
      </div>
      <div className="mt-1 text-xs text-muted">{long}</div>
      <div className="mt-3 text-sm font-semibold">{s.label}</div>
      {detail && <div className="mt-1 text-xs text-muted">{detail}</div>}
    </div>
  );
}

const SEVERITY_STYLE: Record<Reason["severity"], string> = {
  low: "text-muted",
  medium: "text-warn",
  high: "text-crit",
  critical: "text-crit font-bold",
};

export function ReasonList({ reasons, compact = false }: { reasons: Reason[]; compact?: boolean }) {
  if (reasons.length === 0) return <p className="text-sm text-muted">No signals.</p>;
  return (
    <ul className="space-y-2">
      {reasons.map((r) => (
        <li key={r.code} className="flex items-start gap-3">
          <span className={`tabular w-12 shrink-0 text-right font-mono text-sm ${r.delta < 0 ? "text-crit" : "text-ok"}`}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>
          <div className="min-w-0">
            <div className={`text-sm ${SEVERITY_STYLE[r.severity]}`}>{REASON_LABEL[r.code] ?? r.code}</div>
            {!compact && <div className="text-sm text-fg/80">{r.message}</div>}
            {!compact && (r.frameworks.length > 0 || reasonReferences(r.code).length > 0) && (
              <div className="mt-0.5 text-xs text-muted">
                {[...r.frameworks, ...reasonReferences(r.code)].join(" · ")}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RailBadge({ rail }: { rail: string }) {
  const card = rail === "virtual_card";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${card ? "border-accent/40 text-accent" : "border-line text-muted"}`} title={card ? "Single-use virtual card on the connected bank account" : "AVAX transfer from the guardian wallet"}>
      {card ? "💳 Card" : "⛓ AVAX"}
    </span>
  );
}

export function ExplorerLink({ url, label = "View on Snowtrace" }: { url: string | null | undefined; label?: string }) {
  if (!url) return <span className="text-sm text-muted">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-accent underline-offset-2 hover:underline">
      {label} ↗
    </a>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: { children: ReactNode; variant?: "primary" | "ghost" | "danger" | "ok" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-accent text-white shadow-sm shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/30",
    ghost: "border border-line bg-transparent hover:border-muted hover:bg-surface-2",
    danger: "bg-crit text-white shadow-sm shadow-crit/20 hover:bg-crit/90 hover:shadow-crit/30",
    ok: "bg-ok text-white shadow-sm shadow-ok/20 hover:bg-ok/90 hover:shadow-ok/30",
  }[variant];
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold outline-none transition duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass = "mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent";

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}

export function DecisionLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Link href={`/dashboard/decisions/${id}`} className="hover:underline">
      {children}
    </Link>
  );
}
