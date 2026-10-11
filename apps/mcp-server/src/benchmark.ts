/**
 * Benchmark of the merchant trust score against public datasets:
 *   scam  = OpenPhish live feed snapshot (phishing pages)
 *   legit = well-known e-commerce domains (ranked in Tranco)
 * Read-only HTTP fetches with a timeout; nothing is executed or submitted.
 *
 *   npx tsx src/benchmark.ts --scam benchmark/scam-openphish.txt --legit benchmark/legit.tsv --out ../web/public/benchmark/latest.json --label v1
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { checkMerchant, type MerchantCheck } from "./merchant.js";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
const scamFile = args.get("scam")!;
const legitFile = args.get("legit")!;
const out = args.get("out") ?? "benchmark-latest.json";
const label = args.get("label") ?? "run";
const limit = Number(args.get("limit") ?? 1000);
const concurrency = Number(args.get("concurrency") ?? 8);

interface Row {
  url: string;
  domain: string;
  truth: "scam" | "legit";
  tranco_rank: number | null;
  verdict: MerchantCheck["verdict"];
  score: number;
  signals: string[];
  http_status: number;
  error: string | null;
}

const scam = [...new Set(readFileSync(scamFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => /^https?:/.test(l)))].slice(0, limit);
const legit = readFileSync(legitFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, limit).map((l) => {
  const [url, rank] = l.split("\t");
  return { url, rank: rank ? Number(rank) : null };
});

async function run<T, R>(items: T[], fn: (t: T) => Promise<R>, n: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
        process.stderr.write(`\r${idx + 1}/${items.length}`);
      }
    }),
  );
  process.stderr.write("\n");
  return results;
}

const toRow = (truth: Row["truth"], rank: number | null) => async (url: string): Promise<Row> => {
  const c = await checkMerchant(url, []);
  return { url, domain: c.domain, truth, tranco_rank: rank, verdict: c.verdict, score: c.score, signals: c.signals.map((s) => s.code), http_status: c.http_status, error: c.error ?? null };
};

const rows: Row[] = [
  ...(await run(scam, toRow("scam", null), concurrency)),
  ...(await run(legit, async (l) => toRow("legit", l.rank)(l.url), concurrency)),
];

function summarize(group: Row[]) {
  const n = group.length || 1;
  const counts = { TRUSTED: 0, SUSPICIOUS: 0, FRAUDULENT: 0, UNVERIFIED: 0 } as Record<MerchantCheck["verdict"], number>;
  const signalCounts = new Map<string, number>();
  for (const r of group) {
    counts[r.verdict] += 1;
    for (const s of r.signals) signalCounts.set(s, (signalCounts.get(s) ?? 0) + 1);
  }
  return {
    count: group.length,
    mean_score: Math.round(group.reduce((a, r) => a + r.score, 0) / n),
    verdicts: counts,
    reachable: group.filter((r) => r.http_status > 0 && r.http_status < 400).length,
    top_signals: [...signalCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, c]) => ({ code, count: c, pct: Math.round((100 * c) / n) })),
  };
}

const scamRows = rows.filter((r) => r.truth === "scam");
const legitRows = rows.filter((r) => r.truth === "legit");
const summary = {
  label,
  generated_at: new Date().toISOString(),
  scam: summarize(scamRows),
  legit: summarize(legitRows),
  /** Scam pages we would have paid: rated TRUSTED. */
  fooled_rate_pct: Math.round((100 * scamRows.filter((r) => r.verdict === "TRUSTED").length) / (scamRows.length || 1)),
  /** Scam pages caught: FRAUDULENT or SUSPICIOUS (SUSPICIOUS = human confirmation). */
  detection_rate_pct: Math.round((100 * scamRows.filter((r) => r.verdict !== "TRUSTED").length) / (scamRows.length || 1)),
  /** Legit sites we would have blocked outright. */
  false_block_rate_pct: Math.round((100 * legitRows.filter((r) => r.verdict === "FRAUDULENT").length) / (legitRows.length || 1)),
  /** Legit sites that would have needed a human. */
  false_hold_rate_pct: Math.round((100 * legitRows.filter((r) => r.verdict === "SUSPICIOUS").length) / (legitRows.length || 1)),
  /** Legit sites we could not read (unreachable, bot wall, empty): told to the agent as such. */
  legit_unverified_rate_pct: Math.round((100 * legitRows.filter((r) => r.verdict === "UNVERIFIED").length) / (legitRows.length || 1)),
};

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
