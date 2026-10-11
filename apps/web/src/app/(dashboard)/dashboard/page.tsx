"use client";

import { useState } from "react";
import type { BalanceResponse, Decision, Framework } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { FRAMEWORK_LABEL, formatAvax, formatDate, formatMoney, REASON_LABEL, shortAddress } from "@/components/labels";
import type { ReasonCode } from "@payguard/shared";
import { CHIP_COLOR_VAR, Card, classifyDecision, DecisionLink, EmptyState, ExplorerLink, FrameworkTile, PageHeader, RailBadge, ScoreBadge, VerdictPill } from "@/components/ui";
import { PendingApprovals } from "@/components/PendingApprovals";
import type { ComplianceReport } from "@/lib/dashboard/service";
import type { DashboardMetrics, DailyBucket, DailySpend } from "@/lib/analytics/metrics";
import { scoreColor } from "@/components/ui";

type TileIcon = (props: { className?: string }) => React.ReactNode;

/** Simple monotone (currentColor) category glyphs for the overview tiles — no icon library. */
const CardRailIcon: TileIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="4" width="13" height="9" rx="1.5" />
    <path d="M1.5 7h13" />
  </svg>
);
const ChainRailIcon: TileIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 9.5l3-3" />
    <path d="M6 4.5H4.5A2.5 2.5 0 002 7a2.5 2.5 0 002.5 2.5H6" />
    <path d="M10 11.5h1.5A2.5 2.5 0 0014 9a2.5 2.5 0 00-2.5-2.5H10" />
  </svg>
);
const ActivityIcon: TileIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 8.5h2.3l1.3-4 2 7 1.4-5 .9 2h3.1" />
  </svg>
);
const ShieldIcon: TileIcon = ({ className }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5l5.5 2v4c0 4-2.7 6.1-5.5 7-2.8-.9-5.5-3-5.5-7v-4z" />
  </svg>
);

function TileTitle({ icon: Icon, children }: { icon: TileIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
      {children}
    </span>
  );
}

const DOT_COLOR = { ok: "bg-ok", warn: "bg-warn", crit: "bg-crit" } as const;
function CountDot({ color, count, label }: { color: keyof typeof DOT_COLOR; count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[color]}`} />
      {count} {label}
    </span>
  );
}

/** Five evenly-spaced indices across a series, so axis labels fit any period length. */
function axisTicks(length: number): number[] {
  if (length <= 1) return length === 1 ? [0] : [];
  const n = Math.min(5, length);
  return Array.from(new Set(Array.from({ length: n }, (_, k) => Math.round((k / (n - 1)) * (length - 1)))));
}

type Balance = BalanceResponse & { contract_address: string; contract_url: string };

function VolumeChart({ data }: { data: DailyBucket[] }) {
  const maxVal = Math.max(1, ...data.map((d) => d.total));
  const W = 560;
  const H = 120;
  const BAR = Math.floor(W / data.length) - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {data.map((d, i) => {
        const x = i * (BAR + 1);
        const approvedH = (d.approved / maxVal) * (H - 20);
        const blockedH = (d.blocked / maxVal) * (H - 20);
        const heldH = (d.held / maxVal) * (H - 20);
        const base = H - 20;
        return (
          <g key={d.date}>
            <title>{`${d.date}: ${d.approved} approved, ${d.blocked} blocked, ${d.held} held`}</title>
            <rect x={x} y={base - approvedH} width={BAR} height={approvedH} className="fill-ok/70" />
            <rect x={x} y={base - approvedH - blockedH} width={BAR} height={blockedH} className="fill-crit/70" />
            <rect x={x} y={base - approvedH - blockedH - heldH} width={BAR} height={heldH} className="fill-warn/70" />
          </g>
        );
      })}
      {axisTicks(data.length).map((i) => (
        <text key={i} x={i * (BAR + 1) + BAR / 2} y={H - 4} className="fill-muted text-[8px]" textAnchor="middle" fontSize={8}>
          {data[i]?.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function SpendChart({ data }: { data: DailySpend[] }) {
  const cumulative = data.reduce<number[]>((acc, d, i) => [...acc, (acc[i - 1] ?? 0) + d.avax], []);
  const maxVal = Math.max(0.001, cumulative[cumulative.length - 1] ?? 0);
  const W = 560;
  const H = 80;
  const n = cumulative.length;
  const pts = cumulative
    .map((v, i) => `${n > 1 ? (i / (n - 1)) * W : W / 2},${H - (v / maxVal) * (H - 10)}`)
    .join(" ");
  const area = `0,${H} ` + pts + ` ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polygon points={area} className="fill-accent/20" />
      <polyline points={pts} className="stroke-accent fill-none" strokeWidth={1.5} />
    </svg>
  );
}

/** Fixed top-to-bottom order: good outcomes first, bad outcomes last. */
const OUTCOME_ORDER = ["approved", "paid_human", "pending", "failed", "rejected_human", "blocked"] as const;

/** Requests → final outcome (incl. human overrides on a HOLD), as flowing gradient ribbons. */
function DecisionFlowSankey({ decisions }: { decisions: Decision[] }) {
  const W = 640;
  const H = 240;
  const marginY = 10;
  const nodeW = 8;
  const leftX = 4;
  const rightMargin = 180;
  const rightX = W - rightMargin - nodeW;
  const innerGap = 8;
  const plotH = H - marginY * 2;

  const counts = new Map<string, { count: number; label: string; cssVar: string }>();
  for (const d of decisions) {
    const outcome = classifyDecision(d.verdict, d.status);
    const prev = counts.get(outcome.key);
    counts.set(outcome.key, { count: (prev?.count ?? 0) + 1, label: outcome.label, cssVar: CHIP_COLOR_VAR[outcome.color] });
  }

  const segments = OUTCOME_ORDER.flatMap((key) => {
    const c = counts.get(key);
    return c ? [{ key, value: c.count, label: c.label, cssVar: c.cssVar }] : [];
  });

  if (segments.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }

  const sum = segments.reduce((a, s) => a + s.value, 0);
  const rightAvailable = plotH - innerGap * (segments.length - 1);

  const { flows } = segments.reduce(
    (acc, s) => {
      const srcH = (s.value / sum) * plotH;
      const dstH = (s.value / sum) * rightAvailable;
      const flow = { ...s, srcY: acc.srcCursor, srcH, dstY: acc.dstCursor, dstH };
      return { srcCursor: acc.srcCursor + srcH, dstCursor: acc.dstCursor + dstH + innerGap, flows: [...acc.flows, flow] };
    },
    { srcCursor: marginY, dstCursor: marginY, flows: [] as Array<(typeof segments)[number] & { srcY: number; srcH: number; dstY: number; dstH: number }> },
  );

  const midX = (leftX + nodeW + rightX) / 2;
  const ribbon = (f: (typeof flows)[number]) =>
    `M ${leftX + nodeW} ${f.srcY} C ${midX} ${f.srcY}, ${midX} ${f.dstY}, ${rightX} ${f.dstY} ` +
    `L ${rightX} ${f.dstY + f.dstH} C ${midX} ${f.dstY + f.dstH}, ${midX} ${f.srcY + f.srcH}, ${leftX + nodeW} ${f.srcY + f.srcH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        {flows.map((f) => (
          <linearGradient key={f.key} id={`sankey-${f.key}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--accent)" }} stopOpacity={0.6} />
            <stop offset="100%" style={{ stopColor: `var(${f.cssVar})` }} stopOpacity={0.6} />
          </linearGradient>
        ))}
      </defs>
      {flows.map((f) => (
        <path key={f.key} d={ribbon(f)} fill={`url(#sankey-${f.key})`}>
          <title>{`${f.label}: ${f.value}`}</title>
        </path>
      ))}
      <rect x={leftX} y={marginY} width={nodeW} height={plotH} rx={3} style={{ fill: "var(--accent)" }} />
      {flows.map((f) => (
        <g key={f.key}>
          <rect x={rightX} y={f.dstY} width={nodeW} height={f.dstH} rx={3} style={{ fill: `var(${f.cssVar})` }} />
          <text x={rightX + nodeW + 8} y={f.dstY + f.dstH / 2 + 4} style={{ fill: `var(${f.cssVar})` }} fontSize={12} fontWeight={600}>
            {f.label} · {f.value}
          </text>
        </g>
      ))}
      <text x={leftX} y={marginY - 2} className="fill-muted" fontSize={10}>
        {sum} requests
      </text>
    </svg>
  );
}

const PERIOD_PRESETS = [7, 30, 90, 365];

export default function OverviewPage() {
  const [days, setDays] = useState(30);
  const balance = usePolling<Balance>("/api/dashboard/balance", 5000);
  const compliance = usePolling<ComplianceReport>("/api/dashboard/compliance", 3000);
  const decisions = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?limit=6", 3000);
  const pendingPoll = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?status=PENDING_CONFIRMATION&limit=50", 3000);
  const metrics = usePolling<DashboardMetrics>(`/api/dashboard/metrics?days=${days}`, 30_000);
  const allDecisions = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?limit=200", 30_000);
  const c = compliance.data;
  const m = metrics.data;
  // eslint-disable-next-line react-hooks/purity -- a clock read for a display filter is fine here
  const cutoff = Date.now() - days * 86_400_000;
  const periodDecisions = (allDecisions.data?.decisions ?? []).filter((d) => new Date(d.created_at).getTime() >= cutoff);
  const pendingDecisions = pendingPoll.data?.decisions ?? [];
  const pending = pendingDecisions.length;

  return (
    <>
      <PageHeader title="Overview" subtitle="Agent payment requests, PayGuard decisions, and your compliance status." />

      {/* Payments awaiting confirmation — actionable inline, no navigation needed. Hidden entirely when empty so the rest of the page moves up. */}
      {pending > 0 && (
        <Card title={`Payments awaiting your confirmation · ${pending}`} className="mb-6">
          <PendingApprovals decisions={pendingDecisions} refresh={pendingPoll.refresh} />
        </Card>
      )}

      {/* Balances + Decisions + Kill switch — one shape for every tile: icon + label, one stat, one caption line. */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title={<TileTitle icon={CardRailIcon}>Virtual card rail</TileTitle>}>
          <div className="tabular text-3xl font-bold">{balance.data?.card_rail ? formatMoney(balance.data.card_rail.balance, "EUR") : "…"}</div>
          <div className="mt-2 truncate text-xs text-muted">
            {balance.data?.card_rail?.cards_active ?? 0} active card{balance.data?.card_rail?.cards_active === 1 ? "" : "s"}
            {balance.data?.card_rail?.frozen ? <span className="ml-2 font-medium text-crit">frozen</span> : null}
          </div>
        </Card>
        <Card title={<TileTitle icon={ChainRailIcon}>Avalanche rail</TileTitle>}>
          <div className="tabular text-3xl font-bold">{balance.data ? formatAvax(balance.data.balance) : "…"}</div>
          <div className="mt-2 truncate text-xs text-muted">
            <ExplorerLink url={balance.data?.explorer_url} label={balance.data ? shortAddress(balance.data.address) : "…"} />
          </div>
        </Card>
        <Card title={<TileTitle icon={ActivityIcon}>Decisions · 24 h</TileTitle>}>
          <div className="tabular text-3xl font-bold">{c?.decisions.total ?? "…"}</div>
          <div className="mt-2 flex gap-3 text-xs text-muted">
            <CountDot color="ok" count={c?.decisions.approved ?? 0} label="paid" />
            <CountDot color="warn" count={c?.decisions.pending ?? 0} label="pending" />
            <CountDot color="crit" count={c?.decisions.blocked ?? 0} label="blocked" />
          </div>
        </Card>
        <Card title={<TileTitle icon={ShieldIcon}>Incidents · 24 h</TileTitle>}>
          <div className={`tabular text-3xl font-bold ${c && c.incidents.length > 0 ? "text-crit" : ""}`}>{c?.incidents.length ?? "…"}</div>
          <div className="mt-2 truncate text-xs text-muted">
            {c && c.incidents.length > 0
              ? `Last: ${formatDate(c.incidents[0].at)} · ${c.incidents[0].event === "KILL_SWITCH_ON" ? "Activated" : "Re-armed"}`
              : "No incidents"}
          </div>
        </Card>
      </div>

      {/* Period selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted">Period:</span>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                days === p ? "bg-accent text-white" : "border border-line bg-transparent text-muted hover:bg-surface-2"
              }`}
            >
              {p} d
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>Custom</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={days}
            onChange={(e) => {
              const v = Math.min(365, Math.max(1, Number(e.target.value) || 1));
              setDays(v);
            }}
            className="w-14 rounded-full border border-line bg-transparent px-3 py-1 text-center text-fg outline-none focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span>days</span>
        </label>
      </div>

      {/* Analytics stat cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title={`Total requests (${days} d)`}>
          <div className="tabular text-3xl font-bold">{m?.totalRequests ?? "…"}</div>
        </Card>
        <Card title={`Amount spent AVAX (${days} d)`}>
          <div className="tabular text-3xl font-bold">{m ? formatAvax(String(m.totalSpentAvax)) : "…"}</div>
        </Card>
        <Card title={`Approval rate (${days} d)`}>
          <div className="tabular text-3xl font-bold">{m ? `${m.approvalRate}%` : "…"}</div>
        </Card>
        <Card title={`Avg trust score (${days} d)`}>
          <div className={`tabular text-3xl font-bold ${m ? scoreColor(m.avgTrustScore) : ""}`}>
            {m ? `${m.avgTrustScore}/100` : "…"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title={`Daily volume — last ${days} days`}>
          {m ? (
            <>
              <VolumeChart data={m.dailyVolume} />
              <div className="mt-2 flex gap-4 text-xs text-muted">
                <span><span className="inline-block h-2 w-2 rounded-sm bg-ok/70 mr-1" />Approved</span>
                <span><span className="inline-block h-2 w-2 rounded-sm bg-crit/70 mr-1" />Blocked</span>
                <span><span className="inline-block h-2 w-2 rounded-sm bg-warn/70 mr-1" />Held</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </Card>
        <Card title={`Cumulative AVAX spend — last ${days} days`}>
          {m ? <SpendChart data={m.dailySpend} /> : <p className="text-sm text-muted">Loading…</p>}
        </Card>
      </div>

      {/* Decision flow */}
      <Card title={`Decision flow (${days} d)`} className="mb-6">
        {allDecisions.data ? <DecisionFlowSankey decisions={periodDecisions} /> : <p className="text-sm text-muted">Loading…</p>}
      </Card>

      {/* Top merchants + top rules */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title={`Top merchants (${days} d)`}>
          {m?.topMerchants.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4">Merchant</th>
                  <th className="pb-2 pr-4 text-right">Requests</th>
                  <th className="pb-2 text-right">AVAX spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {m.topMerchants.map((r) => (
                  <tr key={r.name}>
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4 text-right tabular">{r.count}</td>
                    <td className="py-2 text-right tabular">{r.totalAvax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No data yet.</p>
          )}
        </Card>
        <Card title={`Most triggered rules (${days} d)`}>
          {m?.topRules.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4">Rule</th>
                  <th className="pb-2 text-right">Triggers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {m.topRules.map((r) => (
                  <tr key={r.code}>
                    <td className="py-2 pr-4">{REASON_LABEL[r.code as ReasonCode] ?? r.code}</td>
                    <td className="py-2 text-right tabular">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No data yet.</p>
          )}
        </Card>
      </div>

      {/* Recent decisions */}
      <Card title="Recent decisions" className="mb-6">
        {decisions.data && decisions.data.decisions.length === 0 && <EmptyState>No decisions yet. Ask your agent to make a purchase.</EmptyState>}
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
              {(d.payment_tx?.explorer_url ?? d.ledger_tx?.explorer_url) && (
                <ExplorerLink url={d.payment_tx?.explorer_url ?? d.ledger_tx?.explorer_url} label="tx" />
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* Compliance — last, since it's a status summary, not the primary content */}
      <Card title="Compliance — last 24 h">
        <div className="grid gap-4 md:grid-cols-4">
          {(["DORA", "MiCA", "AML_CFT", "AI_ACT"] as Framework[]).map((f) => {
            const fw = c?.frameworks[f];
            const detail = fw
              ? fw.state === "ok"
                ? "No signal"
                : `${fw.fail} alert${fw.fail > 1 ? "s" : ""}, ${fw.warn} warning${fw.warn > 1 ? "s" : ""}${fw.top_reasons[0] ? ` · ${REASON_LABEL[fw.top_reasons[0] as ReasonCode] ?? fw.top_reasons[0]}` : ""}`
              : "…";
            return <FrameworkTile key={f} name={FRAMEWORK_LABEL[f].short} long={FRAMEWORK_LABEL[f].long} state={fw?.state ?? "ok"} detail={detail} />;
          })}
        </div>
      </Card>
    </>
  );
}
