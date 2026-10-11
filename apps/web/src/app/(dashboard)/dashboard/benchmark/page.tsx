"use client";

import { useState } from "react";
import { usePolling } from "@/components/hooks";
import { Card, EmptyState, PageHeader } from "@/components/ui";

interface Signal { code: string; count: number; pct: number }
interface Group { count: number; mean_score: number; verdicts: Record<string, number>; reachable: number; top_signals: Signal[] }
interface Summary { label: string; generated_at: string; scam: Group; legit: Group; fooled_rate_pct: number; detection_rate_pct: number; false_block_rate_pct: number; false_hold_rate_pct: number }
interface Row { url: string; domain: string; truth: "scam" | "legit"; tranco_rank: number | null; verdict: string; score: number; signals: string[]; http_status: number; error: string | null }
interface Run { summary: Summary; rows: Row[] }

const pct = (n: number) => `${n} %`;
const verdictClass = (v: string) => (v === "TRUSTED" ? "text-ok" : v === "SUSPICIOUS" ? "text-warn" : "text-crit");

export default function BenchmarkPage() {
  const { data } = usePolling<{ runs: Run[] }>("/api/dashboard/benchmark", 15000);
  const runs = data?.runs ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "scam" | "legit" | "errors">("errors");
  const run = runs.find((r) => r.summary.label === selected) ?? runs[runs.length - 1];

  const rows = (run?.rows ?? []).filter((r) => {
    if (filter === "all") return true;
    if (filter === "errors") return (r.truth === "scam" && r.verdict === "TRUSTED") || (r.truth === "legit" && r.verdict !== "TRUSTED");
    return r.truth === filter;
  });

  return (
    <>
      <PageHeader title="Benchmark" subtitle="The merchant trust score tested on public datasets: live phishing URLs (OpenPhish feed) versus well-known e-commerce sites (ranked in Tranco)." />
      {runs.length === 0 && <EmptyState>No benchmark run yet. Run: npx tsx src/benchmark.ts in apps/mcp-server.</EmptyState>}

      {runs.length > 0 && (
        <Card title="Runs" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4">Run</th>
                  <th className="py-2 pr-4">Scam sites</th>
                  <th className="py-2 pr-4">Legit sites</th>
                  <th className="py-2 pr-4">Mean score scam</th>
                  <th className="py-2 pr-4">Mean score legit</th>
                  <th className="py-2 pr-4">Scams caught</th>
                  <th className="py-2 pr-4">Would have been fooled</th>
                  <th className="py-2 pr-4">Legit wrongly blocked</th>
                  <th className="py-2">Legit sent to a human</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {runs.map((r) => {
                  const s = r.summary;
                  const active = r === run;
                  return (
                    <tr key={s.label} className={`cursor-pointer ${active ? "bg-surface-2" : ""}`} onClick={() => setSelected(s.label)}>
                      <td className="py-3 pr-4 font-semibold">{s.label} <span className="text-xs font-normal text-muted">{new Date(s.generated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span></td>
                      <td className="tabular py-3 pr-4">{s.scam.count}</td>
                      <td className="tabular py-3 pr-4">{s.legit.count}</td>
                      <td className="tabular py-3 pr-4 text-crit">{s.scam.mean_score}/100</td>
                      <td className="tabular py-3 pr-4 text-ok">{s.legit.mean_score}/100</td>
                      <td className="tabular py-3 pr-4 font-semibold text-ok">{pct(s.detection_rate_pct)}</td>
                      <td className="tabular py-3 pr-4 font-semibold text-crit">{pct(s.fooled_rate_pct)}</td>
                      <td className="tabular py-3 pr-4 text-crit">{pct(s.false_block_rate_pct)}</td>
                      <td className="tabular py-3 text-warn">{pct(s.false_hold_rate_pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Caught = rated FRAUDULENT or SUSPICIOUS (a human confirms). Fooled = a scam page rated TRUSTED. Click a run to inspect its sites below.</p>
        </Card>
      )}

      {run && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {(["scam", "legit"] as const).map((cls) => (
            <Card key={cls} title={`${run.summary.label} · top signals on ${cls} sites`}>
              <ul className="space-y-1 text-sm">
                {run.summary[cls].top_signals.map((s) => (
                  <li key={s.code} className="flex items-center gap-3">
                    <span className="tabular w-12 text-right font-mono text-muted">{s.pct}%</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className={`h-full ${cls === "scam" ? "bg-crit" : "bg-accent"}`} style={{ width: `${s.pct}%` }} /></div>
                    <span className="w-56 truncate font-mono text-xs">{s.code}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {run && (
        <Card
          title={`${run.summary.label} · sites`}
          action={
            <select id="benchmark-filter" className="rounded-lg border border-line bg-bg px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="errors">Errors only</option>
              <option value="scam">Scam sites</option>
              <option value="legit">Legit sites</option>
              <option value="all">All</option>
            </select>
          }
        >
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4">Truth</th>
                  <th className="py-2 pr-4">Verdict</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">HTTP</th>
                  <th className="py-2">Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => (
                  <tr key={`${r.url}-${i}`}>
                    <td className={`py-2 pr-4 font-semibold ${r.truth === "scam" ? "text-crit" : "text-ok"}`}>{r.truth}</td>
                    <td className={`py-2 pr-4 font-semibold ${verdictClass(r.verdict)}`}>{r.verdict}</td>
                    <td className="tabular py-2 pr-4">{r.score}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.domain}{r.tranco_rank ? <span className="text-muted"> · #{r.tranco_rank}</span> : null}</td>
                    <td className="tabular py-2 pr-4 text-xs text-muted">{r.http_status || "—"}</td>
                    <td className="py-2 font-mono text-[11px] text-muted">{r.signals.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
