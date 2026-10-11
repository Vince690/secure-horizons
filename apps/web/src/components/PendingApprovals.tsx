"use client";

import { useState } from "react";
import type { Decision } from "@payguard/shared";
import { postJson } from "@/components/hooks";
import { formatDate, formatMoney, shortAddress } from "@/components/labels";
import { Button, Card, DecisionLink, RailBadge, ReasonList, ScoreBadge } from "@/components/ui";

/**
 * Shared, actionable list of payments awaiting human confirmation.
 * Used on both the Overview and the standalone Approvals page so the
 * approve/reject behavior stays identical in both places.
 */
export function PendingApprovals({ decisions, refresh }: { decisions: Decision[]; refresh: () => Promise<void> | void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      await postJson(`/api/dashboard/decisions/${id}/${action}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-crit">{error}</p>}
      <div className="space-y-4">
        {decisions.map((d) => (
          <Card key={d.decision_id}>
            <div className="flex flex-wrap items-start gap-6">
              <ScoreBadge score={d.score} size="xl" />
              <div className="min-w-0 flex-1">
                <DecisionLink id={d.decision_id}>
                  <div className="text-xl font-semibold">{d.purpose}</div>
                </DecisionLink>
                <div className="mt-1 text-muted">
                  <span className="tabular text-lg font-semibold text-fg">{formatMoney(d.amount, d.currency)}</span> <RailBadge rail={d.rail} /> → {d.recipient.name ?? "merchant"} ({shortAddress(d.recipient.address)})
                  {d.recipient.domain ? ` · ${d.recipient.domain}` : ""} · agent {d.agent_id} · {formatDate(d.created_at)}
                </div>
                <p className="mt-3 text-sm">{d.explanation}</p>
                <div className="mt-4">
                  <ReasonList reasons={d.reasons} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ok" onClick={() => act(d.decision_id, "approve")} disabled={busy === d.decision_id}>
                  {busy === d.decision_id ? "Processing…" : d.rail === "virtual_card" ? "Approve and issue card" : "Approve and pay"}
                </Button>
                <Button variant="danger" onClick={() => act(d.decision_id, "reject")} disabled={busy === d.decision_id}>
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
