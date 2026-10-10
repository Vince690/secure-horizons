import type { ChainClient } from "@payguard/shared";
import { createFujiChainClient } from "@payguard/chain";
import { env } from "@/lib/env";
import { createMockChainClient } from "./mock";

// Kept on globalThis so the mock's balance and pause flag survive Next.js hot reloads.
const globalForChain = globalThis as unknown as { chainClient?: ChainClient; chainClientMode?: string };

/**
 * The single entry point for chain access.
 * CHAIN_MODE=mock  -> in-memory mock (default while PAYGUARD_CONTRACT_ADDRESS is empty)
 * CHAIN_MODE=fuji  -> viem client against PayGuardLedger on Avalanche Fuji (43113)
 */
export function getChainClient(): ChainClient {
  if (globalForChain.chainClient && globalForChain.chainClientMode === env.chainMode) return globalForChain.chainClient;

  let client: ChainClient;
  if (env.chainMode === "fuji") {
    if (!env.guardianPrivateKey || !env.contractAddress) {
      throw new Error("CHAIN_MODE=fuji needs GUARDIAN_PRIVATE_KEY and PAYGUARD_CONTRACT_ADDRESS in the root .env");
    }
    client = createFujiChainClient({
      rpcUrl: env.fujiRpcUrl,
      privateKey: env.guardianPrivateKey as `0x${string}`,
      contractAddress: env.contractAddress as `0x${string}`,
      explorerBaseUrl: env.snowtraceBaseUrl,
    });
    console.log(`[chain] mode=fuji contract=${env.contractAddress} wallet=${client.walletAddress()}`);
  } else {
    client = createMockChainClient({
      balance: env.mockBalance,
      explorerBaseUrl: env.snowtraceBaseUrl,
      latencyMs: 150,
      knownAddresses: [env.merchantLegitAddress],
    });
    console.log("[chain] mode=mock (set CHAIN_MODE=fuji + PAYGUARD_CONTRACT_ADDRESS for real Fuji transactions)");
  }
  globalForChain.chainClient = client;
  globalForChain.chainClientMode = env.chainMode;
  return client;
}
