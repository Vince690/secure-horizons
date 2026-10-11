import type { ReactNode } from "react";
import Link from "next/link";
import type { ComplianceState, DecisionStatus, Reason, Verdict } from "@payguard/shared";
import { REASON_LABEL, reasonReferences, STATUS_LABEL, VERDICT_LABEL } from "./labels";

export function Card({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
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

const VERDICT_STYLE: Record<Verdict, string> = {
  APPROVED: "bg-ok/15 text-ok border-ok/40",
  HOLD: "bg-warn/15 text-warn border-warn/40",
  BLOCKED: "bg-crit/15 text-crit border-crit/40",
};

/** The pill shows the FINAL state: a HOLD approved by a human reads "Payé (humain)", not "En attente". */
export function VerdictPill({ verdict, status }: { verdict: Verdict; status?: DecisionStatus }) {
  let label = VERDICT_LABEL[verdict];
  let style = VERDICT_STYLE[verdict];
  if (status === "APPROVED") {
    label = verdict === "HOLD" ? "Payé (humain)" : "Approuvé";
    style = VERDICT_STYLE.APPROVED;
  } else if (status === "REJECTED") {
    label = "Rejeté (humain)";
    style = VERDICT_STYLE.BLOCKED;
  } else if (status === "PENDING_CONFIRMATION") {
    label = STATUS_LABEL.PENDING_CONFIRMATION;
    style = VERDICT_STYLE.HOLD;
  } else if (status === "FAILED") {
    label = STATUS_LABEL.FAILED;
    style = VERDICT_STYLE.HOLD;
  } else if (status === "BLOCKED") {
    label = VERDICT_LABEL.BLOCKED;
    style = VERDICT_STYLE.BLOCKED;
  }
  return <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${style}`}>{label}</span>;
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
  ok: { ring: "border-ok/40", dot: "bg-ok", label: "Conforme" },
  warn: { ring: "border-warn/60", dot: "bg-warn", label: "Vigilance" },
  fail: { ring: "border-crit/60", dot: "bg-crit", label: "Alerte" },
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
  if (reasons.length === 0) return <p className="text-sm text-muted">Aucun signal.</p>;
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
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${card ? "border-accent/40 text-accent" : "border-line text-muted"}`} title={card ? "Carte virtuelle à usage unique sur le compte bancaire" : "Transfert AVAX depuis le wallet gardien"}>
      {card ? "💳 Carte" : "⛓ AVAX"}
    </span>
  );
}

export function ExplorerLink({ url, label = "Voir sur Snowtrace" }: { url: string | null | undefined; label?: string }) {
  if (!url) return <span className="text-sm text-muted">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-accent underline-offset-2 hover:underline">
      {label} ↗
    </a>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: { children: ReactNode; variant?: "primary" | "ghost" | "danger" | "ok" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-accent text-white hover:bg-accent/90",
    ghost: "border border-line bg-transparent hover:bg-surface-2",
    danger: "bg-crit text-white hover:bg-crit/90",
    ok: "bg-ok text-white hover:bg-ok/90",
  }[variant];
  return (
    <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`} {...props}>
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
