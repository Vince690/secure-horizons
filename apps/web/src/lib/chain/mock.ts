import { createHash } from "node:crypto";
import type { ChainReference } from "@payguard/shared";
import { formatAvax, parseAvax } from "../guardian/money";
import type { ChainClient, OnChainVerdict } from "./types";

export interface MockChainOptions {
  /** Starting balance in AVAX. */
  balance?: string;
  explorerBaseUrl?: string;
  /** Simulated confirmation delay, ms. 0 in tests. */
  latencyMs?: number;
}

/**
 * In-memory stand-in for Fuji. Deterministic fake tx hashes, a balance that
 * really decreases, a pause flag that really blocks pay(). Good enough to run
 * the whole demo without network until step 5.
 */
export function createMockChainClient(options: MockChainOptions = {}): ChainClient & { calls: string[] } {
  let balanceWei = parseAvax(options.balance ?? "2");
  let paused = false;
  let nonce = 0;
  const base = options.explorerBaseUrl ?? "https://testnet.snowtrace.io";
  const latency = options.latencyMs ?? 0;
  const calls: string[] = [];

  const fakeTx = (label: string): ChainReference => {
    nonce += 1;
    const tx_hash = `0x${createHash("sha256").update(`${label}:${nonce}`).digest("hex")}`;
    return { tx_hash, explorer_url: `${base}/tx/${tx_hash}`, block_number: 40_000_000 + nonce };
  };
  const wait = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  return {
    calls,
    async getBalance() {
      calls.push("getBalance");
      return formatAvax(balanceWei);
    },
    async executePayment(decisionId, to, amountAvax, decisionHash) {
      calls.push(`executePayment:${decisionId}`);
      await wait();
      if (paused) throw new Error("PayGuardLedger: paused");
      const amount = parseAvax(amountAvax);
      if (amount > balanceWei) throw new Error("PayGuardLedger: insufficient balance");
      balanceWei -= amount;
      return fakeTx(`pay:${decisionId}:${to}:${decisionHash}`);
    },
    async recordDecision(decisionId, verdict: OnChainVerdict, decisionHash) {
      calls.push(`recordDecision:${decisionId}:${verdict}`);
      await wait();
      return fakeTx(`record:${decisionId}:${verdict}:${decisionHash}`);
    },
    async setKillSwitch(active, reason) {
      calls.push(`setKillSwitch:${active}`);
      await wait();
      paused = active;
      return fakeTx(`killswitch:${active}:${reason}`);
    },
    async isPaused() {
      return paused;
    },
    explorerUrl(txHash) {
      return `${base}/tx/${txHash}`;
    },
  };
}
