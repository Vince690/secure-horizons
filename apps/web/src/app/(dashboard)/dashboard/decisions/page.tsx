"use client";

import type { Decision } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { formatDate, formatMoney, REASON_LABEL, shortAddress } from "@/components/labels";
import { Card, DecisionLink, EmptyState, ExplorerLink, PageHeader, RailBadge, ScoreBadge, VerdictPill } from "@/components/ui";

export default function DecisionsPage() {
  const { data } = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?limit=100", 3000);
  const rows = data?.decisions ?? [];
  return (
    <>
      <PageHeader title="Décisions" subtitle="Chaque demande de paiement d'un agent, son score, son verdict et sa preuve on-chain." />
      <Card>
        {data && rows.length === 0 && <EmptyState>Aucune décision.</EmptyState>}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Verdict</th>
                  <th className="py-2 pr-4">Objet</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Marchand</th>
                  <th className="py-2 pr-4">Signaux</th>
                  <th className="py-2 pr-4">Quand</th>
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
                      <ExplorerLink url={d.payment_tx?.explorer_url ?? d.ledger_tx?.explorer_url} label={d.payment_tx ? "paiement" : "ancrage"} />
                      {d.card && <div className="mt-1 font-mono text-xs text-muted">carte ····{d.card.last4}</div>}
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
