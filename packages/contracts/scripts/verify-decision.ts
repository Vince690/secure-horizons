/**
 * Proves a decision was not altered: recomputes its hash from the JSON the API
 * returns and compares it with the hash anchored in PayGuardLedger on Fuji.
 *
 *   npm run verify-decision -w packages/contracts -- dec_xxx            (fetches from PAYGUARD_API_URL)
 *   npm run verify-decision -w packages/contracts -- ./decision.json    (local file)
 */
import { readFileSync } from "node:fs";
import { computeDecisionHash, type Decision } from "@payguard/shared";
import { readOnChainDecision } from "../client";

async function loadDecision(arg: string): Promise<Decision> {
  if (arg.endsWith(".json")) return JSON.parse(readFileSync(arg, "utf8")) as Decision;
  const base = (process.env.PAYGUARD_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/payments/${arg}`, { headers: { Authorization: `Bearer ${process.env.PAYGUARD_API_KEY ?? ""}` } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as Decision;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error("usage: verify-decision <decision_id | file.json>");
  const contract = process.env.PAYGUARD_CONTRACT_ADDRESS as `0x${string}` | undefined;
  if (!contract) throw new Error("PAYGUARD_CONTRACT_ADDRESS missing in .env");
  const rpc = process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";

  const d = await loadDecision(arg);
  const recomputed = computeDecisionHash({
    decision_id: d.decision_id,
    request_id: d.request_id,
    agent_id: d.agent_id,
    amount: d.amount,
    currency: d.currency,
    recipient: { address: d.recipient.address },
    purpose: d.purpose,
    verdict: d.verdict,
    score: d.score,
    reasons: d.reasons,
    created_at: d.created_at,
  });
  const onChain = await readOnChainDecision(rpc, contract, d.decision_id);

  console.log(`Decision      ${d.decision_id}  (${d.verdict}, score ${d.score})`);
  console.log(`Stored hash   ${d.decision_hash}`);
  console.log(`Recomputed    ${recomputed}`);
  console.log(`On-chain      ${onChain.recorded ? onChain.decisionHash.slice(2) : "(not anchored)"}`);
  if (!onChain.recorded) {
    console.log("RESULT: NON ANCRÉE (aucune trace on-chain pour cet identifiant)");
    process.exit(2);
  }
  const intact = recomputed === d.decision_hash && `0x${recomputed}` === onChain.decisionHash;
  console.log(intact ? "RESULT: INTÈGRE — la décision n'a pas été altérée depuis son ancrage" : "RESULT: ALTÉRÉE — le hash recalculé ne correspond pas à l'ancrage");
  process.exit(intact ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
