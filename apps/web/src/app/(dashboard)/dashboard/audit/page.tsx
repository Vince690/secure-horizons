"use client";

import { useState } from "react";
import type { AuditEntry } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { AUDIT_LABEL, formatDate } from "@/components/labels";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

interface AuditResponse { entries: AuditEntry[]; chain: { intact: boolean; brokenAt: number | null; length: number } }

export default function AuditPage() {
  const { data } = usePolling<AuditResponse>("/api/dashboard/audit?limit=200", 3000);
  const chain = data?.chain;
  const [exporting, setExporting] = useState(false);

  async function exportLog() {
    setExporting(true);
    try {
      const res = await fetch("/api/dashboard/audit/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? "payguard-audit.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Every event is hash-chained: editing or deleting any entry breaks the chain."
        action={
          <div className="flex items-center gap-3">
            {chain && (
              <span className={`rounded-full border px-4 py-2 text-sm font-bold ${chain.intact ? "border-ok/50 bg-ok/10 text-ok" : "border-crit/50 bg-crit/10 text-crit"}`}>
                {chain.intact ? `Chain intact · ${chain.length} entries` : `Chain broken at entry ${chain.brokenAt}`}
              </span>
            )}
            <Button variant="ghost" onClick={exportLog} disabled={exporting}>
              {exporting ? "Exporting…" : "Export log (JSON)"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-muted">
        <p className="font-semibold text-fg">What the audit log is for</p>
        <p className="mt-1">
          The audit log is a complete, tamper-evident, append-only record of every security-relevant event on your
          account — decisions created, payments executed, policy changes, kill-switch activations, and API keys created.
          It exists so you can meet regulatory obligations (DORA incident reporting, AI Act transparency, and AML/CFT
          traceability) and so you have a reliable trail for dispute resolution and forensic investigation.
        </p>
        <p className="mt-2">
          Integrity is guaranteed by hashing: each entry is SHA-256 hash-chained to the one before it. Any modification,
          deletion, or back-dated insertion breaks the chain — the integrity badge turns red and points to the first
          affected entry. You can download the full log with the Export button above to verify or archive it independently.
        </p>
      </div>

      <Card>
        {data && data.entries.length === 0 && <EmptyState>Audit log is empty.</EmptyState>}
        <ul className="divide-y divide-line">
          {data?.entries.map((e) => (
            <li key={e.seq} className="grid grid-cols-[3rem_11rem_1fr] gap-4 py-3 text-sm">
              <span className="tabular font-mono text-muted">#{e.seq}</span>
              <span className="tabular font-mono text-xs text-muted">{formatDate(e.created_at)}</span>
              <div className="min-w-0">
                <div className="font-medium">{AUDIT_LABEL[e.event] ?? e.event}</div>
                <div className="truncate font-mono text-xs text-muted">{JSON.stringify(e.payload)}</div>
                <div className="truncate font-mono text-[10px] text-muted/70">{e.hash}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
