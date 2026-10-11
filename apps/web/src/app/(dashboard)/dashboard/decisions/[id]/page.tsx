"use client";

import { use, useState } from "react";
import type { ConversationMessage, Decision, Framework } from "@payguard/shared";
import { postJson, usePolling } from "@/components/hooks";
import { CARD_STATUS_LABEL, FRAMEWORK_LABEL, formatDate, formatMoney, RAIL_LABEL, STATUS_LABEL } from "@/components/labels";
import { Button, Card, ExplorerLink, FrameworkTile, PageHeader, RailBadge, ReasonList, VerdictPill } from "@/components/ui";
import { TrustScore } from "@/components/TrustScore";

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
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide">Hidden from humans · {p.hidden.replace(/^HIDDEN\s*/, "") || "HTML comment"}</span>
            {p.text.trim()}
          </span>
        ) : (
          <span key={i} className="text-fg/80">{p.text}</span>
        ),
      )}
    </div>
  );
}

function VirtualCardPanel({ d, refresh }: { d: Detail; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const card = d.card!;
  async function charge(amount: string, merchant: string, label: string) {
    setBusy(label);
    setMsg(null);
    try {
      const r = await postJson<{ authorization: { approved: boolean; reason: string } }>(`/api/dashboard/cards/${card.card_id}/authorize`, { amount, merchant });
      setMsg(`${r.authorization.approved ? "✅ Authorised" : "⛔ Declined"}: ${r.authorization.reason}`);
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }
  const merchant = card.merchant_lock ?? d.recipient.name ?? "merchant";
  return (
    <Card title="Single-use virtual card (banking sandbox)">
      <div className="rounded-xl border border-accent/40 bg-gradient-to-br from-surface-2 to-bg p-4">
        <div className="flex items-center justify-between text-xs text-muted"><span>{card.provider}</span><span className="font-bold text-fg">{card.brand}</span></div>
        <div className="mt-4 font-mono text-2xl tracking-widest">{card.masked}</div>
        <div className="mt-2 flex justify-between font-mono text-xs text-muted"><span>EXP {card.expiry}</span><span>cap {formatMoney(card.limit_amount, card.currency)}</span></div>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{CARD_STATUS_LABEL[card.status] ?? card.status}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Locked to</dt><dd>{card.merchant_lock ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Expires</dt><dd className="tabular">{formatDate(card.expires_at)}</dd></div>
        {card.last_authorization && (
          <div className="flex justify-between"><dt className="text-muted">Last charge</dt><dd className={card.last_authorization.approved ? "text-ok" : "text-crit"}>{formatMoney(card.last_authorization.amount, card.currency)} · {card.last_authorization.reason}</dd></div>
        )}
      </dl>
      <p className="mt-3 text-xs text-muted">The full card number is never shown to the agent — it is held by the issuer and entered via the secure checkout component. Capped at the exact amount, single use, single merchant.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ok" disabled={busy !== null} onClick={() => charge(card.limit_amount, merchant, "ok")}>{busy === "ok" ? "…" : `Simulate charge ${merchant}`}</Button>
        <Button variant="ghost" disabled={busy !== null} onClick={() => charge((Number(card.limit_amount) * 3).toFixed(2), merchant, "over")}>{busy === "over" ? "…" : "Simulate ×3 charge"}</Button>
        <Button variant="ghost" disabled={busy !== null} onClick={() => charge(card.limit_amount, "other-merchant.shop", "other")}>{busy === "other" ? "…" : "Simulate different merchant"}</Button>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}

export default function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: d, error, refresh } = usePolling<Detail>(`/api/dashboard/decisions/${id}`, 3000);
  if (error) return <p className="text-crit">{error}</p>;
  if (!d) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <PageHeader title={d.purpose} subtitle={`Decision ${d.decision_id} · agent ${d.agent_id} · ${formatDate(d.created_at)}`} action={<VerdictPill verdict={d.verdict} status={d.status} />} />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="Trust score">
          <TrustScore score={d.score} size="lg" />
          <p className="mt-3 text-sm">{d.explanation}</p>
        </Card>
        <Card title="Payment">
          <div className="tabular text-2xl font-bold">{formatMoney(d.amount, d.currency)}</div>
          <div className="mt-1"><RailBadge rail={d.rail} /> <span className="text-xs text-muted">{RAIL_LABEL[d.rail]}</span></div>
          <div className="mt-1 text-sm">{d.recipient.name ?? "Merchant"}{d.recipient.domain ? ` · ${d.recipient.domain}` : ""}</div>
          <div className="mt-1 break-all font-mono text-xs text-muted">{d.recipient.address}</div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{STATUS_LABEL[d.status]}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Resolved by</dt><dd>{d.resolved_by === "human" ? "human" : d.resolved_by === "guardian" ? "guardian" : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">On</dt><dd className="tabular">{formatDate(d.resolved_at)}</dd></div>
          </dl>
        </Card>
        <Card title="On-chain proof">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted">Payment transaction</dt><dd><ExplorerLink url={d.payment_tx?.explorer_url} label={d.payment_tx ? d.payment_tx.tx_hash.slice(0, 18) + "…" : undefined} /></dd></div>
            <div><dt className="text-muted">Decision anchor</dt><dd><ExplorerLink url={d.ledger_tx?.explorer_url} label={d.ledger_tx ? d.ledger_tx.tx_hash.slice(0, 18) + "…" : undefined} /></dd></div>
            <div><dt className="text-muted">Decision hash (SHA-256)</dt><dd className="break-all font-mono text-xs">{d.decision_hash}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">Can be recalculated at any time with <code>npm run verify-decision -- {d.decision_id}</code>.</p>
        </Card>
      </div>

      {d.card && <div className="mb-6">{<VirtualCardPanel d={d} refresh={refresh} />}</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title="Signals & point deductions">
          <ReasonList reasons={d.reasons} />
        </Card>
        <Card title="Regulatory frameworks">
          <div className="grid grid-cols-2 gap-3">
            {(["DORA", "MiCA", "AML_CFT", "AI_ACT"] as Framework[]).map((f) => (
              <FrameworkTile key={f} name={FRAMEWORK_LABEL[f].short} long={FRAMEWORK_LABEL[f].long} state={d.compliance[f]} />
            ))}
          </div>
        </Card>
      </div>

      {d.context && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="What the user requested">
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
              <p className="text-sm text-muted">No messages transmitted by the agent.</p>
            )}
          </Card>
          <Card title={`What the agent read${d.context.page_url ? ` · ${d.context.page_url}` : ""}`}>
            {d.context.page_excerpt ? <PageExcerpt text={d.context.page_excerpt} /> : <p className="text-sm text-muted">The agent provided no page excerpt.</p>}
          </Card>
        </div>
      )}
    </>
  );
}
