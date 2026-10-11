"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Decision } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { formatDate, formatMoney, REASON_LABEL, shortAddress } from "@/components/labels";
import { Card, DecisionLink, EmptyState, ExplorerLink, PageHeader, RailBadge, ScoreBadge, VerdictPill } from "@/components/ui";

const VERDICT_OPTIONS = [
  { value: "ALL", label: "All verdicts" },
  { value: "APPROVED", label: "Approved" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "HELD", label: "Held" },
] as const;

const DATE_OPTIONS = [
  { value: "ALL", label: "All time" },
  { value: "7", label: "7 d" },
  { value: "30", label: "30 d" },
  { value: "90", label: "90 d" },
] as const;

function FilterPills({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            value === o.value ? "bg-accent text-white" : "border border-line bg-transparent text-muted hover:bg-surface-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type SortKey = "score" | "amount" | "when";
type SortState = { key: SortKey; dir: "asc" | "desc" };

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg viewBox="0 0 10 10" className={`h-2.5 w-2.5 shrink-0 transition ${dir ? "text-fg" : "text-muted/50"}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {dir === "asc" ? <path d="M2 6.5L5 3.5L8 6.5" /> : <path d="M2 3.5L5 6.5L8 3.5" />}
    </svg>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className = "" }: { label: string; sortKey: SortKey; sort: SortState; onSort: (k: SortKey) => void; className?: string }) {
  const active = sort.key === sortKey;
  return (
    <th className={className}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-fg">
        {label}
        <SortIcon dir={active ? sort.dir : null} />
      </button>
    </th>
  );
}

export default function DecisionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verdictFilter = searchParams.get("verdict") ?? "ALL";
  const dateFilter = searchParams.get("days") ?? "ALL";
  const [sort, setSort] = useState<SortState>({ key: "when", dir: "desc" });

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") p.delete(key);
    else p.set(key, value);
    router.replace(`/dashboard/decisions?${p.toString()}`);
  }

  function onSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  const statusMap: Record<string, string> = {
    APPROVED: "APPROVED",
    BLOCKED: "BLOCKED",
    HELD: "PENDING_CONFIRMATION",
  };
  const apiStatus = statusMap[verdictFilter];
  const daysAgo = dateFilter === "ALL" ? undefined : Number(dateFilter);

  const { data } = usePolling<{ decisions: Decision[] }>(
    `/api/dashboard/decisions?limit=200${apiStatus ? `&status=${apiStatus}` : ""}`,
    3000,
  );

  // eslint-disable-next-line react-hooks/purity -- a clock read for a display filter is fine here
  const cutoff = daysAgo ? Date.now() - daysAgo * 86_400_000 : 0;
  const filtered = (data?.decisions ?? []).filter((d) => !daysAgo || new Date(d.created_at).getTime() >= cutoff);

  const sortValue = (d: Decision): number =>
    sort.key === "score" ? d.score : sort.key === "amount" ? Number(d.amount) : new Date(d.created_at).getTime();
  const rows = [...filtered].sort((a, b) => (sortValue(a) - sortValue(b)) * (sort.dir === "asc" ? 1 : -1));

  return (
    <>
      <PageHeader title="History" subtitle="Every payment request from an agent: its score, verdict, and on-chain proof." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterPills options={VERDICT_OPTIONS} value={verdictFilter} onChange={(v) => setFilter("verdict", v)} />
        <span className="h-5 w-px bg-line" />
        <FilterPills options={DATE_OPTIONS} value={dateFilter} onChange={(v) => setFilter("days", v)} />
      </div>

      <Card>
        {data && rows.length === 0 && <EmptyState>No decisions yet.</EmptyState>}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <SortHeader label="Score" sortKey="score" sort={sort} onSort={onSort} className="py-2 pr-4" />
                  <th className="py-2 pr-4">Verdict</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={onSort} className="py-2 pr-4" />
                  <th className="py-2 pr-4">Merchant</th>
                  <th className="py-2 pr-4">Signals</th>
                  <SortHeader label="When" sortKey="when" sort={sort} onSort={onSort} className="py-2 pr-4" />
                  <th className="py-2">On-chain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((d) => (
                  <tr key={d.decision_id} className="align-top">
                    <td className="py-3 pr-4"><ScoreBadge score={d.score} /></td>
                    <td className="py-3 pr-4"><VerdictPill verdict={d.verdict} status={d.status} /></td>
                    <td className="py-3 pr-4 font-medium"><DecisionLink id={d.decision_id}>{d.purpose}</DecisionLink></td>
                    <td className="tabular py-3 pr-4">
                      <div>{formatMoney(d.amount, d.currency)}</div>
                      <div className="mt-1"><RailBadge rail={d.rail} /></div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{d.recipient.name ?? "—"}</div>
                      <div className="font-mono text-xs text-muted">{shortAddress(d.recipient.address)}{d.recipient.domain ? ` · ${d.recipient.domain}` : ""}</div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted">
                      {d.reasons.filter((r) => r.delta < 0).slice(0, 3).map((r) => REASON_LABEL[r.code] ?? r.code).join(", ") || "—"}
                      {d.reasons.filter((r) => r.delta < 0).length > 3 ? "…" : ""}
                    </td>
                    <td className="tabular py-3 pr-4 text-xs text-muted">{formatDate(d.created_at)}</td>
                    <td className="py-3">
                      <ExplorerLink url={d.payment_tx?.explorer_url ?? d.ledger_tx?.explorer_url} label={d.payment_tx ? "payment" : "anchor"} />
                      {d.card && <div className="mt-1 font-mono text-xs text-muted">card ····{d.card.last4}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
