"use client";

import type { AuditEntry } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { AUDIT_LABEL, formatDate } from "@/components/labels";
import { Card, EmptyState, PageHeader } from "@/components/ui";

interface AuditResponse { entries: AuditEntry[]; chain: { intact: boolean; brokenAt: number | null; length: number } }

export default function AuditPage() {
  const { data } = usePolling<AuditResponse>("/api/dashboard/audit?limit=200", 3000);
  const chain = data?.chain;
  return (
    <>
      <PageHeader
        title="Journal d'audit"
        subtitle="Chaque événement est haché avec le précédent : modifier ou supprimer une ligne casse la chaîne."
        action={
          chain && (
            <span className={`rounded-full border px-4 py-2 text-sm font-bold ${chain.intact ? "border-ok/50 bg-ok/10 text-ok" : "border-crit/50 bg-crit/10 text-crit"}`}>
              {chain.intact ? `Chaîne intègre · ${chain.length} entrées` : `Chaîne rompue à l'entrée ${chain.brokenAt}`}
            </span>
          )
        }
      />
      <Card>
        {data && data.entries.length === 0 && <EmptyState>Journal vide.</EmptyState>}
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
