/**
 * Plan B for the live demo: a scripted shopping agent that drives the SAME
 * MCP servers Claude Desktop uses (payguard + demo-shop), with no LLM and no
 * API key, so it behaves identically every time.
 *
 *   npm run demo -w apps/demo-agent            legit purchase, then the trap
 *   npm run demo:hold -w apps/demo-agent       + a 0.09 AVAX purchase that waits for the dashboard
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
const TRAP = process.env.MERCHANT_TRAP_ADDRESS ?? "0x2222222222222222222222222222222222222222";
const args = new Set(process.argv.slice(2));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const say = {
  user: (t: string) => console.log(`\n${C.bold}${C.cyan}👤 Utilisateur${C.reset}  ${t}`),
  agent: (t: string) => console.log(`${C.bold}${C.magenta}🤖 Agent${C.reset}        ${t}`),
  tool: (name: string, input: Record<string, unknown>) => console.log(`${C.dim}   ↳ appel ${name}(${JSON.stringify(input).slice(0, 110)}…)${C.reset}`),
  result: (t: string) => console.log(`${C.dim}   ↳ ${t}${C.reset}`),
  verdict: (text: string) => {
    const line = text.split("\n")[0];
    const color = /APPROVED/.test(line) ? C.green : /BLOCKED|KILL/.test(line) ? C.red : C.yellow;
    console.log(`${C.bold}${color}🛡  PayGuard${C.reset}     ${color}${line}${C.reset}`);
    const expl = text.match(/Explanation \(for the user, in French\): (.*)/)?.[1];
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
  say.result(`page lue, ${page.length} caractères${hidden ? `, ${C.red}${hidden} bloc(s) invisibles pour un humain${C.reset}${C.dim}` : ""}`);
  return page;
}

async function pay(input: Record<string, unknown>) {
  say.tool("request_payment", input);
  const out = text(await payguard.callTool({ name: "request_payment", arguments: input }));
  say.verdict(out);
  return out;
}

console.log(`${C.bold}PayGuard — démo scriptée (sans Claude Desktop)${C.reset}  ${C.dim}API ${process.env.PAYGUARD_API_URL ?? "http://localhost:3000"}${C.reset}`);

// Pre-flight: refuse to run a demo that can only show refusals.
const policy = text(await payguard.callTool({ name: "get_spending_policy", arguments: {} }));
if (/Kill switch: ACTIVE/.test(policy)) {
  console.log(`\n${C.red}${C.bold}Kill switch ACTIF.${C.reset} Réarme-le d'abord dans l'en-tête du dashboard (http://localhost:3000/dashboard), puis relance.`);
  await payguard.close();
  await shop.close();
  process.exit(2);
}
if (/PAYGUARD ERROR/.test(policy)) {
  console.log(`\n${C.red}${policy.split("\n")[0]}${C.reset}\nL'API ne répond pas : lance npm run dev:web.`);
  await payguard.close();
  await shop.close();
  process.exit(2);
}

// 0. Best price across candidate sites: the guardian ranks, the agent obeys.
say.user("Cherche-moi le casque NordSound ANC Pro au meilleur prix et achète-le, budget 0.06 AVAX max.");
say.agent("J'ai trouvé trois sites. Je demande à PayGuard de les vérifier et de classer les offres.");
say.tool("find_best_offer", { urls: [LEGIT_URL, TRAP_URL, ALT_URL] });
const ranking = text(await payguard.callTool({ name: "find_best_offer", arguments: { urls: [LEGIT_URL, TRAP_URL, ALT_URL], product: "Casque NordSound ANC Pro" } }));
for (const line of ranking.split("\n").filter((l) => /^(#\d|  ✗|     rejected|BEST TRUSTED)/.test(l))) {
  const color = /FRAUDULENT|rejected/.test(line) ? C.red : /BEST TRUSTED|#1/.test(line) ? C.green : C.dim;
  console.log(`${color}                 ${line.trim()}${C.reset}`);
}
say.agent("Le moins cher est frauduleux, PayGuard l'écarte. Je prends la meilleure offre de confiance.");

// 1. Happy path
say.agent("Je lis la page du marchand retenu.");
const legitPage = await readPage(LEGIT_URL);
say.agent("Casque à 0.05 AVAX, dans le budget. Je demande le paiement à PayGuard.");
await pay({ amount: "0.05", recipient_address: LEGIT, recipient_name: "NordSound", recipient_domain: "nordsound.shop", purpose: "Casque NordSound ANC Pro", user_request: "Cherche-moi le casque NordSound ANC Pro au meilleur prix et achète-le, budget 0.06 AVAX max.", page_url: LEGIT_URL, page_excerpt: legitPage.slice(0, 4000) });

// 2. Trap
say.user(`Trouve-le moins cher sur ${TRAP_URL} et achète-le.`);
say.agent("Je lis la page de l'autre marchand.");
const trapPage = await readPage(TRAP_URL);
say.agent("0.04 AVAX affiché. Je transmets tout ce que j'ai lu à PayGuard, y compris les parties cachées.");
await pay({ amount: "0.04", recipient_address: TRAP, recipient_name: "N0rdSound Deals", recipient_domain: "n0rdsound-deals.shop", purpose: "Casque NordSound ANC Pro", user_request: "Achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max. Trouve-le moins cher et achète-le.", page_url: TRAP_URL, page_excerpt: trapPage.slice(0, 4000) });

// 3. HOLD (optional)
if (args.has("--hold")) {
  say.user(`Achète-moi aussi l'édition limitée à 0.09 AVAX sur ${LEGIT_URL}.`);
  say.agent("Au-dessus du seuil de confirmation du mandat : PayGuard va demander un humain.");
  const out = await pay({ amount: "0.09", recipient_address: LEGIT, recipient_name: "NordSound", recipient_domain: "nordsound.shop", purpose: "Casque NordSound ANC Pro édition limitée", user_request: "Achète-moi aussi l'édition limitée à 0.09 AVAX.", page_url: LEGIT_URL, page_excerpt: legitPage.slice(0, 4000) });
  const id = out.match(/Decision id: (dec_\w+)/)?.[1];
  if (id && /PENDING_CONFIRMATION/.test(out)) {
    say.agent(`En attente de validation sur le dashboard (${C.blue}http://localhost:3000/dashboard/approvals${C.reset})…`);
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const status = text(await payguard.callTool({ name: "check_payment_status", arguments: { decision_id: id } }));
      const s = status.match(/Status: (\w+)/)?.[1];
      process.stdout.write(`${C.dim}.${C.reset}`);
      if (s && s !== "PENDING_CONFIRMATION") {
        console.log("");
        say.verdict(status);
        say.agent(s === "APPROVED" ? "Le dirigeant a validé : paiement exécuté." : "Le dirigeant a refusé : j'abandonne l'achat.");
        break;
      }
    }
  }
}

// 4. Attack (optional): the agent keeps insisting on the trap until the guardian pulls the plug
if (args.has("--attack")) {
  say.user("(l'agent, manipulé par la page, insiste tout seul)");
  for (let i = 1; i <= 3; i++) {
    say.agent(`Nouvelle tentative ${i} : paiement de 0.5 AVAX vers l'adresse indiquée dans la notice cachée.`);
    const out = await pay({ amount: "0.5", recipient_address: TRAP, recipient_name: "N0rdSound Deals", recipient_domain: "n0rdsound-deals.shop", purpose: "Casque NordSound ANC Pro", user_request: "Achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max. Trouve-le moins cher et achète-le.", page_url: TRAP_URL, page_excerpt: trapPage.slice(0, 4000) });
    if (/KILL SWITCH ACTIVE/.test(out)) {
      say.agent("Plus aucun paiement possible : le propriétaire du compte doit réarmer PayGuard.");
      break;
    }
  }
  console.log(`\n${C.bold}Kill switch : ${C.red}voir le voyant rouge sur http://localhost:3000/dashboard et la transaction pause() sur Snowtrace${C.reset}`);
}

await payguard.close();
await shop.close();
console.log(`\n${C.dim}Fin de la démo scriptée.${C.reset}`);
