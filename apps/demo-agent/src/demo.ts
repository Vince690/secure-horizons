/**
 * Plan B for the live demo: a scripted shopping agent that drives the SAME
 * MCP servers Claude Desktop uses (payguard + demo-shop), with no LLM and no
 * API key, so it behaves identically every time.
 *
 *   npm run demo -w apps/demo-agent            legit purchase, then the trap
 *   npm run demo:card -w apps/demo-agent       + a euro payment by single-use virtual card
 *   npm run demo:hold -w apps/demo-agent       + a first purchase at a new merchant that waits for the dashboard
 *   npm run demo:attack -w apps/demo-agent     + the agent insists on the trap until the kill switch fires
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../.env") });

const C = { reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m", magenta: "\x1b[35m" };
const LEGIT_URL = process.env.MERCHANT_LEGIT_URL ?? "http://localhost:4001/";
const TRAP_URL = process.env.MERCHANT_TRAP_URL ?? "http://localhost:4002/";
const ALT_URL = process.env.MERCHANT_ALT_URL ?? "http://localhost:4003/";
const LEGIT = process.env.MERCHANT_LEGIT_ADDRESS ?? "0x1111111111111111111111111111111111111111";
const ALT = process.env.MERCHANT_ALT_ADDRESS ?? "0x3333333333333333333333333333333333333333";
const TRAP = process.env.MERCHANT_TRAP_ADDRESS ?? "0x2222222222222222222222222222222222222222";
const args = new Set(process.argv.slice(2));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const say = {
  user: (t: string) => console.log(`\n${C.bold}${C.cyan}👤 User${C.reset}  ${t}`),
  agent: (t: string) => console.log(`${C.bold}${C.magenta}🤖 Agent${C.reset}        ${t}`),
  tool: (name: string, input: Record<string, unknown>) => console.log(`${C.dim}   ↳ call ${name}(${JSON.stringify(input).slice(0, 110)}…)${C.reset}`),
  result: (t: string) => console.log(`${C.dim}   ↳ ${t}${C.reset}`),
  verdict: (text: string) => {
    const line = text.split("\n")[0];
    const color = /APPROVED/.test(line) ? C.green : /BLOCKED|KILL/.test(line) ? C.red : C.yellow;
    console.log(`${C.bold}${color}🛡  PayGuard${C.reset}     ${color}${line}${C.reset}`);
    const expl = text.match(/Explanation \(for the user, in English\): (.*)/)?.[1];
    if (expl) console.log(`                 ${expl}`);
    for (const r of text.matchAll(/^  - \[(\w+)\] (\w+): (.*)$/gm)) console.log(`${C.dim}                 • ${r[2]} — ${r[3]}${C.reset}`);
    const tx = text.match(/(Payment transaction[^:]*|Decision anchored on-chain): (\S+)/);
    if (tx) console.log(`                 ${C.blue}${tx[2]}${C.reset}`);
    const ks = text.match(/KILL SWITCH ACTIVE/);
    if (ks) console.log(`                 ${C.red}${text.split("\n")[1]}${C.reset}`);
  },
};

async function connect(script: string) {
  const client = new Client({ name: "demo-agent", version: "0.1.0" });
  const tsx = path.resolve(here, "../../../node_modules/tsx/dist/cli.mjs");
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [tsx, path.resolve(here, "../../mcp-server/src", script)] }));
  return client;
}
const text = (r: unknown) => (((r as { content?: Array<{ type: string; text?: string }> }).content ?? []).find((c) => c.type === "text")?.text ?? "");

const payguard = await connect("payguard.ts");
const shop = await connect("demo-shop.ts");

async function readPage(url: string) {
  say.tool("read_merchant_page", { url });
  const page = text(await shop.callTool({ name: "read_merchant_page", arguments: { url } }));
  const hidden = (page.match(/\[\[(HIDDEN|COMMENT)/g) ?? []).length;
  say.result(`page read, ${page.length} characters${hidden ? `, ${C.red}${hidden} block(s) hidden from humans${C.reset}${C.dim}` : ""}`);
  return page;
}

async function pay(input: Record<string, unknown>) {
  say.tool("request_payment", input);
  const out = text(await payguard.callTool({ name: "request_payment", arguments: input }));
  say.verdict(out);
  return out;
}

console.log(`${C.bold}PayGuard — scripted demo (no Claude Desktop)${C.reset}  ${C.dim}API ${process.env.PAYGUARD_API_URL ?? "http://localhost:3000"}${C.reset}`);

// Pre-flight: refuse to run a demo that can only show refusals.
const policy = text(await payguard.callTool({ name: "get_spending_policy", arguments: {} }));
if (/Kill switch: ACTIVE/.test(policy)) {
  console.log(`\n${C.red}${C.bold}Kill switch ACTIVE.${C.reset} Re-arm it first from the dashboard header (http://localhost:3000/dashboard), then run again.`);
  await payguard.close();
  await shop.close();
  process.exit(2);
}
if (/PAYGUARD ERROR/.test(policy)) {
  console.log(`\n${C.red}${policy.split("\n")[0]}${C.reset}\nAPI not responding: run npm run dev:web.`);
  await payguard.close();
  await shop.close();
  process.exit(2);
}

// 0. Best price across candidate sites: the guardian ranks, the agent obeys.
say.user("Find me the NordSound ANC Pro headset at the best price and buy it, budget 0.06 AVAX max.");
say.agent("I found three sites. I'll ask PayGuard to verify and rank them.");
say.tool("find_best_offer", { urls: [LEGIT_URL, TRAP_URL, ALT_URL] });
const ranking = text(await payguard.callTool({ name: "find_best_offer", arguments: { urls: [LEGIT_URL, TRAP_URL, ALT_URL], product: "NordSound ANC Pro headset" } }));
for (const line of ranking.split("\n").filter((l) => /^(#\d|  ✗|     rejected|BEST TRUSTED)/.test(l))) {
  const color = /FRAUDULENT|rejected/.test(line) ? C.red : /BEST TRUSTED|#1/.test(line) ? C.green : C.dim;
  console.log(`${color}                 ${line.trim()}${C.reset}`);
}
say.agent("The cheapest is fraudulent, PayGuard rejects it. I'll take the best trusted offer.");

// 1. Happy path
say.agent("Reading the chosen merchant's page.");
const legitPage = await readPage(LEGIT_URL);
say.agent("Headset at 0.05 AVAX, within budget. Requesting payment from PayGuard.");
await pay({ amount: "0.05", recipient_address: LEGIT, recipient_name: "NordSound", recipient_domain: "nordsound.shop", purpose: "NordSound ANC Pro headset", user_request: "Find me the NordSound ANC Pro headset at the best price and buy it, budget 0.06 AVAX max.", page_url: LEGIT_URL, page_excerpt: legitPage.slice(0, 4000) });

// 2. Trap
say.user(`Find it cheaper on ${TRAP_URL} and buy it.`);
say.agent("Reading the other merchant's page.");
const trapPage = await readPage(TRAP_URL);
say.agent("0.04 AVAX shown. I pass everything I read to PayGuard, including the hidden parts.");
await pay({ amount: "0.04", recipient_address: TRAP, recipient_name: "N0rdSound Deals", recipient_domain: "n0rdsound-deals.shop", purpose: "NordSound ANC Pro headset", user_request: "Buy me the NordSound ANC Pro headset, budget 0.06 AVAX max. Find it cheaper and buy it.", page_url: TRAP_URL, page_excerpt: trapPage.slice(0, 4000) });

// 2b. Card rail (optional): pay in euros with a single-use virtual card on the owner's bank
if (args.has("--card") || args.has("--hold") || args.has("--attack")) {
  say.user("Actually, pay for the NordSound headset by card, in euros.");
  say.agent("The page shows €49.90 by card. I ask PayGuard to issue a single-use card.");
  const out = await pay({ amount: "49.90", currency: "EUR", recipient_address: LEGIT, recipient_name: "NordSound", recipient_domain: "nordsound.shop", purpose: "NordSound ANC Pro headset", user_request: "Actually, pay for the NordSound ANC Pro headset by card, in euros.", page_url: LEGIT_URL, page_excerpt: legitPage.slice(0, 4000) });
  const card = out.match(/Virtual card issued: (.*)/)?.[1];
  if (card) console.log(`                 ${C.blue}💳 ${card}${C.reset}`);
  say.agent("Card capped at the exact amount, single use, locked to NordSound. I never saw the number. Decision anchored on Avalanche.");
}

// 3. HOLD (optional)
if (args.has("--hold")) {
  say.user(`Actually, order it from AudioPlanet (${ALT_URL}) instead, I prefer this reseller.`);
  say.agent("Trusted site, but first purchase from this merchant: PayGuard will request human approval.");
  const altPage = await readPage(ALT_URL);
  const out = await pay({ amount: "0.052", recipient_address: ALT, recipient_name: "AudioPlanet", recipient_domain: "audioplanet.fr", purpose: "NordSound ANC Pro headset", user_request: "Actually, order the NordSound ANC Pro headset from AudioPlanet, I prefer this reseller.", page_url: ALT_URL, page_excerpt: altPage.slice(0, 4000) });
  const id = out.match(/Decision id: (dec_\w+)/)?.[1];
  if (id && /PENDING_CONFIRMATION/.test(out)) {
    say.agent(`Waiting for approval on the dashboard (${C.blue}http://localhost:3000/dashboard/approvals${C.reset})…`);
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const status = text(await payguard.callTool({ name: "check_payment_status", arguments: { decision_id: id } }));
      const s = status.match(/Status: (\w+)/)?.[1];
      process.stdout.write(`${C.dim}.${C.reset}`);
      if (s && s !== "PENDING_CONFIRMATION") {
        console.log("");
        say.verdict(status);
        say.agent(s === "APPROVED" ? "The owner approved: payment executed." : "The owner rejected: cancelling the purchase.");
        break;
      }
    }
  }
}

// 4. Attack (optional): the agent keeps insisting on the trap until the guardian pulls the plug
if (args.has("--attack")) {
  say.user("(the agent, manipulated by the page, keeps insisting on its own)");
  for (let i = 1; i <= 3; i++) {
    say.agent(`Attempt ${i}: paying 0.5 AVAX to the address from the hidden notice.`);
    const out = await pay({ amount: "0.5", recipient_address: TRAP, recipient_name: "N0rdSound Deals", recipient_domain: "n0rdsound-deals.shop", purpose: "NordSound ANC Pro headset", user_request: "Buy me the NordSound ANC Pro headset, budget 0.06 AVAX max. Find it cheaper and buy it.", page_url: TRAP_URL, page_excerpt: trapPage.slice(0, 4000) });
    if (/KILL SWITCH ACTIVE/.test(out)) {
      say.agent("No more payments possible: the account owner must re-arm PayGuard.");
      break;
    }
  }
  console.log(`\n${C.bold}Kill switch: ${C.red}see the red indicator at http://localhost:3000/dashboard and the pause() transaction on Snowtrace${C.reset}`);
}

await payguard.close();
await shop.close();
console.log(`\n${C.dim}End of scripted demo.${C.reset}`);
