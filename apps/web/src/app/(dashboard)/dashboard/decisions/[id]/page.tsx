"use client";

import { use } from "react";
import type { ConversationMessage, Decision, Framework } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { FRAMEWORK_LABEL, formatAvax, formatDate, STATUS_LABEL } from "@/components/labels";
import { Card, ExplorerLink, FrameworkTile, PageHeader, ReasonList, ScoreBadge, VerdictPill } from "@/components/ui";

type Detail = Decision & { context: { page_url?: string; page_excerpt?: string; conversation?: ConversationMessage[] } | null };

const HIDDEN_RE = /\[\[(HIDDEN[^\]]*|COMMENT)\]\]([\s\S]*?)\[\[\/(?:HIDDEN|COMMENT)\]\]/g;

/** Renders the page excerpt with hidden blocks highlighted: what the human could not see. */
function PageExcerpt({ text }: { text: string }) {
  const parts: Array<{ hidden: string | null; text: string }> = [];
  let last = 0;
  for (const m of text.matchAll(HIDDEN_RE)) {
    if (m.index! > last) parts.push({ hidden: null, text: text.slice(last, m.index) });
    parts.push({ hidden: m[1], text: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ hidden: null, text: text.slice(last) });
  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.hidden ? (
          <span key={i} className="my-1 block rounded border border-crit/50 bg-crit/10 p-2 text-crit">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide">Invisible pour un humain · {p.hidden.replace(/^HIDDEN\s*/, "") || "commentaire HTML"}</span>
            {p.text.trim()}
          </span>
        ) : (
          <span key={i} className="text-fg/80">{p.text}</span>
        ),
      )}
    </div>
  );
}

export default function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: d, error } = usePolling<Detail>(`/api/dashboard/decisions/${id}`, 3000);
  if (error) return <p className="text-crit">{error}</p>;
  if (!d) return <p className="text-muted">Chargement…</p>;

  return (
    <>
      <PageHeader title={d.purpose} subtitle={`Décision ${d.decision_id} · agent ${d.agent_id} · ${formatDate(d.created_at)}`} action={<VerdictPill verdict={d.verdict} status={d.status} />} />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="Score de confiance">
          <ScoreBadge score={d.score} size="xl" />
          <p className="mt-3 text-sm">{d.explanation}</p>
        </Card>
        <Card title="Paiement">
          <div className="tabular text-2xl font-bold">{formatAvax(d.amount)}</div>
          <div className="mt-1 text-sm">{d.recipient.name ?? "Marchand"}{d.recipient.domain ? ` · ${d.recipient.domain}` : ""}</div>
          <div className="mt-1 break-all font-mono text-xs text-muted">{d.recipient.address}</div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Statut</dt><dd>{STATUS_LABEL[d.status]}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Tranché par</dt><dd>{d.resolved_by === "human" ? "un humain" : d.resolved_by === "guardian" ? "le gardien" : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Le</dt><dd className="tabular">{formatDate(d.resolved_at)}</dd></div>
          </dl>
        </Card>
        <Card title="Preuve on-chain">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted">Transaction de paiement</dt><dd><ExplorerLink url={d.payment_tx?.explorer_url} label={d.payment_tx ? d.payment_tx.tx_hash.slice(0, 18) + "…" : undefined} /></dd></div>
            <div><dt className="text-muted">Ancrage de la décision</dt><dd><ExplorerLink url={d.ledger_tx?.explorer_url} label={d.ledger_tx ? d.ledger_tx.tx_hash.slice(0, 18) + "…" : undefined} /></dd></div>
            <div><dt className="text-muted">Hash de décision (SHA-256)</dt><dd className="break-all font-mono text-xs">{d.decision_hash}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">Recalculable à tout moment avec <code>npm run verify-decision -- {d.decision_id}</code>.</p>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title="Signaux et points retirés">
          <ReasonList reasons={d.reasons} />
        </Card>
        <Card title="Cadres réglementaires">
          <div className="grid grid-cols-2 gap-3">
            {(["DORA", "MiCA", "AML_CFT", "AI_ACT"] as Framework[]).map((f) => (
              <FrameworkTile key={f} name={FRAMEWORK_LABEL[f].short} long={FRAMEWORK_LABEL[f].long} state={d.compliance[f]} />
            ))}
          </div>
        </Card>
      </div>

      {d.context && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Ce que l'utilisateur a demandé">
            {d.context.conversation?.length ? (
              <ul className="space-y-2 text-sm">
                {d.context.conversation.map((m, i) => (
                  <li key={i} className={m.role === "user" ? "" : "text-muted"}>
                    <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase">{m.role}</span>
                    {m.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Aucun message transmis par l'agent.</p>
            )}
          </Card>
          <Card title={`Ce que l'agent a lu${d.context.page_url ? ` · ${d.context.page_url}` : ""}`}>
            {d.context.page_excerpt ? <PageExcerpt text={d.context.page_excerpt} /> : <p className="text-sm text-muted">L'agent n'a transmis aucun extrait de page.</p>}
          </Card>
        </div>
      )}
    </>
  );
}
