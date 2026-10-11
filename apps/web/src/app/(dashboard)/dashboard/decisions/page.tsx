"use client";

import { useSearchParams, useRouter } from "next/navigation";
import type { Decision } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { formatDate, formatMoney, REASON_LABEL, shortAddress } from "@/components/labels";
import { Card, DecisionLink, EmptyState, ExplorerLink, PageHeader, RailBadge, ScoreBadge, VerdictPill, inputClass } from "@/components/ui";

export default function DecisionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verdictFilter = searchParams.get("verdict") ?? "ALL";
  const dateFilter = searchParams.get("days") ?? "ALL";

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") p.delete(key);
    else p.set(key, value);
    router.replace(`/dashboard/decisions?${p.toString()}`);
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
  const rows = (data?.decisions ?? []).filter((d) => !daysAgo || new Date(d.created_at).getTime() >= cutoff);

  return (
    <>
      <PageHeader title="History" subtitle="Every payment request from an agent: its score, verdict, and on-chain proof." />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={verdictFilter}
          onChange={(e) => setFilter("verdict", e.target.value)}
          className={inputClass + " mt-0 w-auto"}
        >
          <option value="ALL">All verdicts</option>
          <option value="APPROVED">Approved</option>
          <option value="BLOCKED">Blocked</option>
          <option value="HELD">Held</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setFilter("days", e.target.value)}
          className={inputClass + " mt-0 w-auto"}
        >
          <option value="ALL">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <Card>
        {data && rows.length === 0 && <EmptyState>No decisions yet.</EmptyState>}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Verdict</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Merchant</th>
                  <th className="py-2 pr-4">Signals</th>
                  <th className="py-2 pr-4">When</th>
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
