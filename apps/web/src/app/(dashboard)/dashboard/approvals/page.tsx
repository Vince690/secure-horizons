"use client";

import { useState } from "react";
import type { Decision } from "@payguard/shared";
import { postJson, usePolling } from "@/components/hooks";
import { formatAvax, formatDate, shortAddress } from "@/components/labels";
import { Button, Card, DecisionLink, EmptyState, PageHeader, ReasonList, ScoreBadge } from "@/components/ui";

export default function ApprovalsPage() {
  const { data, refresh } = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?status=PENDING_CONFIRMATION&limit=50", 2000);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      await postJson(`/api/dashboard/decisions/${id}/${action}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  const pending = data?.decisions ?? [];
  return (
    <>
      <PageHeader title="À confirmer" subtitle="Paiements que PayGuard a mis en attente : un humain tranche, la décision est gravée sur Avalanche." />
      {error && <p className="mb-4 text-sm text-crit">{error}</p>}
      {data && pending.length === 0 && <EmptyState>Rien à confirmer. Les paiements au-dessus du seuil de confirmation ou au score intermédiaire apparaîtront ici.</EmptyState>}
      <div className="space-y-4">
        {pending.map((d) => (
          <Card key={d.decision_id}>
            <div className="flex flex-wrap items-start gap-6">
              <ScoreBadge score={d.score} size="xl" />
              <div className="min-w-0 flex-1">
                <DecisionLink id={d.decision_id}>
                  <div className="text-xl font-semibold">{d.purpose}</div>
                </DecisionLink>
                <div className="mt-1 text-muted">
                  <span className="tabular text-lg font-semibold text-fg">{formatAvax(d.amount)}</span> → {d.recipient.name ?? "marchand"} ({shortAddress(d.recipient.address)})
                  {d.recipient.domain ? ` · ${d.recipient.domain}` : ""} · agent {d.agent_id} · {formatDate(d.created_at)}
                </div>
                <p className="mt-3 text-sm">{d.explanation}</p>
                <div className="mt-4">
                  <ReasonList reasons={d.reasons} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ok" onClick={() => act(d.decision_id, "approve")} disabled={busy === d.decision_id}>
                  {busy === d.decision_id ? "Paiement…" : "Approuver et payer"}
                </Button>
                <Button variant="danger" onClick={() => act(d.decision_id, "reject")} disabled={busy === d.decision_id}>
                  Rejeter
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
