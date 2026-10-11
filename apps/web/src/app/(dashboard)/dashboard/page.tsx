"use client";

import type { BalanceResponse, Decision, Framework } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { FRAMEWORK_LABEL, formatAvax, formatDate, formatMoney, REASON_LABEL, shortAddress } from "@/components/labels";
import { Card, DecisionLink, EmptyState, ExplorerLink, FrameworkTile, PageHeader, RailBadge, ScoreBadge, VerdictPill } from "@/components/ui";
import type { ComplianceReport } from "@/lib/dashboard/service";

type Balance = BalanceResponse & { contract_address: string; contract_url: string };

export default function OverviewPage() {
  const balance = usePolling<Balance>("/api/dashboard/balance", 5000);
  const compliance = usePolling<ComplianceReport>("/api/dashboard/compliance", 3000);
  const decisions = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?limit=6", 3000);
  const c = compliance.data;

  return (
    <>
      <PageHeader title="Vue d'ensemble" subtitle="Ce que vos agents ont demandé, ce que PayGuard a décidé, et où vous en êtes côté conformité." />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Rail carte virtuelle · compte bancaire connecté">
          <div className="tabular text-3xl font-bold">{balance.data?.card_rail ? formatMoney(balance.data.card_rail.balance, "EUR") : "…"}</div>
          <div className="mt-2 text-xs text-muted">
            {balance.data?.card_rail?.account_label ?? "…"} · {balance.data?.card_rail?.provider ?? ""}
            {balance.data?.card_rail?.frozen ? <span className="ml-2 text-crit">gelé</span> : null}
          </div>
          <div className="mt-1 text-xs text-muted">{balance.data?.card_rail?.cards_active ?? 0} carte(s) à usage unique active(s) · l'argent ne quitte jamais votre banque</div>
        </Card>
        <Card title="Rail Avalanche · wallet gardien">
          <div className="tabular text-3xl font-bold">{balance.data ? formatAvax(balance.data.balance) : "…"}</div>
          <div className="mt-2 text-xs text-muted">
            {balance.data?.mode === "fuji" ? "Avalanche Fuji" : "Simulé"} · <ExplorerLink url={balance.data?.explorer_url} label={balance.data ? shortAddress(balance.data.address) : "…"} />
          </div>
          {balance.data?.contract_url && (
            <div className="mt-1 text-xs text-muted">
              Contrat : <ExplorerLink url={balance.data.contract_url} label={shortAddress(balance.data.contract_address)} />
            </div>
          )}
        </Card>
        <Card title="Décisions sur 24 h">
          <div className="tabular text-3xl font-bold">{c?.decisions.total ?? "…"}</div>
          <div className="mt-2 flex gap-3 text-xs">
            <span className="text-ok">{c?.decisions.approved ?? 0} payées</span>
            <span className="text-warn">{c?.decisions.pending ?? 0} à confirmer</span>
            <span className="text-crit">{c?.decisions.blocked ?? 0} bloquées</span>
          </div>
        </Card>
        <Card title="Incidents (kill switch)">
          {c && c.incidents.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {c.incidents.slice(0, 3).map((i) => (
                <li key={i.at} className={i.event === "KILL_SWITCH_ON" ? "text-crit" : "text-ok"}>
                  <span className="tabular font-mono text-xs text-muted">{formatDate(i.at)}</span> · {i.event === "KILL_SWITCH_ON" ? "Activé" : "Réarmé"}
                  {i.by ? ` (${i.by === "auto" ? "automatique" : "humain"})` : ""}
                  {i.reason ? ` · ${i.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucun incident sur 24 h. Un incident horodaté ici alimente la notification DORA.</p>
          )}
        </Card>
      </div>

      <Card title="Conformité sur 24 h" className="mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          {(["DORA", "MiCA", "AML_CFT", "AI_ACT"] as Framework[]).map((f) => {
            const fw = c?.frameworks[f];
            const detail = fw
              ? fw.state === "ok"
                ? "Aucun signal"
                : `${fw.fail} alerte${fw.fail > 1 ? "s" : ""}, ${fw.warn} vigilance${fw.warn > 1 ? "s" : ""}${fw.top_reasons[0] ? ` · ${REASON_LABEL[fw.top_reasons[0] as keyof typeof REASON_LABEL] ?? fw.top_reasons[0]}` : ""}`
              : "…";
            return <FrameworkTile key={f} name={FRAMEWORK_LABEL[f].short} long={FRAMEWORK_LABEL[f].long} state={fw?.state ?? "ok"} detail={detail} />;
          })}
        </div>
      </Card>

      <Card title="Dernières décisions">
        {decisions.data && decisions.data.decisions.length === 0 && <EmptyState>Aucune décision pour l'instant. Demandez un achat à votre agent.</EmptyState>}
        <ul className="divide-y divide-line">
          {decisions.data?.decisions.map((d) => (
            <li key={d.decision_id} className="flex items-center gap-4 py-3">
              <ScoreBadge score={d.score} />
              <div className="min-w-0 flex-1">
                <DecisionLink id={d.decision_id}>
                  <div className="truncate font-medium">{d.purpose}</div>
                </DecisionLink>
                <div className="truncate text-xs text-muted">
                  {formatMoney(d.amount, d.currency)} <RailBadge rail={d.rail} /> → {d.recipient.name ?? shortAddress(d.recipient.address)} · {formatDate(d.created_at)}
                </div>
              </div>
              <VerdictPill verdict={d.verdict} status={d.status} />
              <ExplorerLink url={d.payment_tx?.explorer_url ?? d.ledger_tx?.explorer_url} label="tx" />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
