/**
 * Renders a standalone HTML report of all benchmark runs for the jury:
 * big numbers, run-by-run progression, what each iteration fixed, examples.
 * Output: apps/web/public/benchmark/index.html -> http://localhost:3000/benchmark/index.html (no login).
 *   npx tsx src/benchmark-report.ts
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "../web/public/benchmark");
const runs = readdirSync(dir).filter((f) => /^v\d+\.json$/.test(f)).sort((a, b) => Number(a.slice(1, -5)) - Number(b.slice(1, -5))).map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
const last = runs[runs.length - 1];
const first = runs[0];

const CHANGES: Record<string, string> = {
  v1: "Initial score: page signals (hidden text, agent instructions, lookalike), HTTPS, risky TLD, domain age, legal mentions.",
  v2: "Domain age queried on the registrable domain; hidden prices no longer count as hidden instructions; same name under another TLD is not a lookalike for brands.",
  v3: "Free hosting and dynamic DNS penalised; brand name inside the hostname; password / card forms on unknown sites; 403/429 treated as bot protection, not fraud; legal mentions searched on the whole page.",
  v4: "Short brand names need an exact match (etsy ≠ ebay); amazon.de is Amazon; redirects inside the same domain ignored; free hosting alone sends to a human.",
  v5: "Empty pages (nothing to buy) sent to a human; login / verification paths; credential-harvesting wording (verify your account, seed phrase…); machine-generated subdomains; more risky TLDs; no HTTPS weighs more.",
  v6: "Risky TLD alone (.guru, .xyz, .cfd…) now needs a human; machine-generated paths (long hex ids, random tokens) typical of kits dropped on hacked sites.",
  v7: "Fourth verdict UNVERIFIED: unreachable, bot-walled or empty sites are reported as 'could not be checked' instead of guessed; the agent tells the user and a human confirms.",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const pct = (n: number) => `${n}%`;

const caughtScams = (last.rows as Array<{ truth: string; verdict: string; domain: string; score: number; signals: string[] }>)
  .filter((r) => r.truth === "scam" && r.verdict !== "TRUSTED")
  .sort((a, b) => a.score - b.score)
  .slice(0, 8);
const heldLegit = (last.rows as Array<{ truth: string; verdict: string; domain: string; score: number; signals: string[] }>).filter((r) => r.truth === "legit" && r.verdict !== "TRUSTED");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PayGuard — Merchant trust score benchmark</title>
<style>
  :root{--bg:#0b0f17;--surface:#121826;--line:#243049;--fg:#e8edf6;--muted:#8b97ad;--accent:#5b8cff;--ok:#2fbf71;--warn:#f2a93b;--crit:#ef5350}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
  .wrap{max-width:1280px;margin:0 auto;padding:48px 40px}
  h1{font-size:44px;margin:0 0 6px;letter-spacing:-.02em} .sub{color:var(--muted);font-size:20px;margin:0 0 36px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:36px}
  .kpi{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:26px}
  .kpi .v{font-size:64px;font-weight:800;letter-spacing:-.03em;line-height:1} .kpi .l{color:var(--muted);margin-top:8px;font-size:15px}
  .kpi .d{font-size:14px;margin-top:10px} .ok{color:var(--ok)} .crit{color:var(--crit)} .warn{color:var(--warn)} .accent{color:var(--accent)}
  h2{font-size:22px;margin:36px 0 14px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  table{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  th,td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top} th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  td.n{font-variant-numeric:tabular-nums;font-weight:700;font-size:20px} tr:last-child td{border-bottom:0}
  .bar{height:10px;border-radius:5px;background:var(--line);overflow:hidden;margin-top:6px} .bar i{display:block;height:100%}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px}
  code{font:13px ui-monospace,Menlo,monospace;color:var(--muted)}
  .foot{color:var(--muted);font-size:14px;margin-top:36px}
  @media(max-width:900px){.kpis,.grid2{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<div style="color:var(--accent);font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:14px;margin-bottom:10px">PayGuard · benchmark</div>
<h1>Does the merchant score catch real scams?</h1>
<p class="sub">${last.summary.scam.count} live phishing pages (OpenPhish feed, ${new Date(last.summary.generated_at).toLocaleDateString("en-GB")}) vs ${last.summary.legit.count} well-known shops (Tranco-ranked). Read-only fetch, deterministic score, no AI key.</p>

<div class="kpis">
  <div class="kpi"><div class="v ok">${pct(last.summary.detection_rate_pct)}</div><div class="l">scams caught (blocked or sent to a human)</div><div class="d ok">from ${pct(first.summary.detection_rate_pct)} at v1</div></div>
  <div class="kpi"><div class="v crit">${pct(last.summary.fooled_rate_pct)}</div><div class="l">scams we would have paid</div><div class="d crit">from ${pct(first.summary.fooled_rate_pct)} at v1</div></div>
  <div class="kpi"><div class="v ${last.summary.false_block_rate_pct === 0 ? "ok" : "warn"}">${pct(last.summary.false_block_rate_pct)}</div><div class="l">legitimate shops wrongly blocked</div><div class="d">from ${pct(first.summary.false_block_rate_pct)} at v1</div></div>
  <div class="kpi"><div class="v warn">${pct(last.summary.false_hold_rate_pct)}</div><div class="l">legitimate shops sent to a human</div><div class="d">from ${pct(first.summary.false_hold_rate_pct)} at v1</div></div>
</div>

<h2>Iterations: analyse the misses, add a criterion, re-run</h2>
<table><thead><tr><th>Run</th><th>What changed</th><th>Scams caught</th><th>Fooled</th><th>Legit blocked</th><th>Legit held</th></tr></thead><tbody>
${runs.map((r) => `<tr><td><strong>${r.summary.label}</strong><br><code>${new Date(r.summary.generated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</code></td><td style="max-width:520px">${esc(CHANGES[r.summary.label] ?? "")}</td>
<td class="n ok">${pct(r.summary.detection_rate_pct)}<div class="bar"><i style="width:${r.summary.detection_rate_pct}%;background:var(--ok)"></i></div></td>
<td class="n crit">${pct(r.summary.fooled_rate_pct)}<div class="bar"><i style="width:${r.summary.fooled_rate_pct}%;background:var(--crit)"></i></div></td>
<td class="n">${pct(r.summary.false_block_rate_pct)}</td><td class="n warn">${pct(r.summary.false_hold_rate_pct)}</td></tr>`).join("")}
</tbody></table>

<div class="grid2" style="margin-top:18px">
  <div class="card"><h2 style="margin-top:0">Most frequent signals on scams (${last.summary.label})</h2>
  ${(last.summary.scam.top_signals as Array<{ code: string; pct: number }>).map((t) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between"><code>${t.code}</code><span class="crit">${t.pct}%</span></div><div class="bar"><i style="width:${t.pct}%;background:var(--crit)"></i></div></div>`).join("")}</div>
  <div class="card"><h2 style="margin-top:0">Most frequent signals on legitimate shops (${last.summary.label})</h2>
  ${(last.summary.legit.top_signals as Array<{ code: string; pct: number }>).map((t) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between"><code>${t.code}</code><span class="accent">${t.pct}%</span></div><div class="bar"><i style="width:${t.pct}%;background:var(--accent)"></i></div></div>`).join("")}</div>
</div>

<div class="grid2" style="margin-top:18px">
  <div class="card"><h2 style="margin-top:0">Examples of scams caught</h2><table><tbody>
  ${caughtScams.map((r) => `<tr><td><code>${esc(r.domain.slice(0, 42))}</code></td><td class="n crit">${r.score}</td><td><code>${esc(r.signals.filter((s) => !/NO_PRICE|AGE_UNKNOWN/.test(s)).slice(0, 3).join(", "))}</code></td></tr>`).join("")}
  </tbody></table></div>
  <div class="card"><h2 style="margin-top:0">Legitimate shops that would ask a human (${heldLegit.length})</h2><table><tbody>
  ${heldLegit.map((r) => `<tr><td><code>${esc(r.domain)}</code></td><td class="n warn">${r.score}</td><td><code>${esc(r.signals.filter((s) => !/NO_PRICE|AGE_UNKNOWN/.test(s)).slice(0, 3).join(", "))}</code></td></tr>`).join("") || "<tr><td>none</td></tr>"}
  </tbody></table></div>
</div>

<p class="foot">Caught = rated FRAUDULENT (never pay), SUSPICIOUS (a human confirms before paying) or UNVERIFIED (site could not be read: the agent says so, a human confirms). Fooled = rated TRUSTED. Scam set is phishing (credential theft), the closest public dataset available overnight; fake-shop registries are the next step. Lists and runner: <code>apps/mcp-server/benchmark</code> · live table: dashboard › Benchmark.</p>
</div></body></html>`;

writeFileSync(path.join(dir, "index.html"), html);
console.log(`report written for ${runs.map((r) => r.summary.label).join(", ")} -> ${path.join(dir, "index.html")}`);
