import { env } from "@/lib/env";
import { createMockChainClient } from "./mock";
import type { ChainClient } from "./types";

// Kept on globalThis so the mock's balance and pause flag survive Next.js hot reloads.
const globalForChain = globalThis as unknown as { chainClient?: ChainClient };

/**
 * The single entry point for chain access. CHAIN_MODE=mock (default) returns
 * the in-memory mock; CHAIN_MODE=fuji will return Dev B's viem client (step 5).
 */
export function getChainClient(): ChainClient {
  if (globalForChain.chainClient) return globalForChain.chainClient;
  if (env.chainMode === "fuji") {
    // Step 5 replaces this line with: createFujiChainClient({...}) from @payguard/chain
    throw new Error("CHAIN_MODE=fuji is not wired yet (step 5). Use CHAIN_MODE=mock.");
  }
  globalForChain.chainClient = createMockChainClient({
    balance: env.mockBalance,
    explorerBaseUrl: env.snowtraceBaseUrl,
    latencyMs: 150,
  });
  return globalForChain.chainClient;
}
