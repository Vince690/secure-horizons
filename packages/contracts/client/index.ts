import { createPublicClient, createWalletClient, formatEther, http, keccak256, parseEther, toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import type { AddressInfo, ChainClient, ChainReference, OnChainVerdict } from "@payguard/shared";
import { payGuardLedgerAbi } from "./abi";

export { payGuardLedgerAbi } from "./abi";

export interface FujiChainClientOptions {
  rpcUrl: string;
  /** Dedicated hackathon wallet. Never a wallet with real funds. */
  privateKey: `0x${string}`;
  contractAddress: `0x${string}`;
  explorerBaseUrl?: string;
  /** Max wait for a receipt, ms. */
  timeoutMs?: number;
}

export class ChainError extends Error {
  readonly code = "CHAIN_ERROR" as const;
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ChainError";
  }
}

/** keccak256 of the decision id string: the bytes32 key used by the contract. */
export function decisionIdToBytes32(decisionId: string): Hex {
  return keccak256(toBytes(decisionId));
}

/**
 * viem implementation of ChainClient against PayGuardLedger on Fuji (43113).
 * Writes are serialized through a promise chain so two decisions evaluated at
 * the same time never race for the same nonce.
 */
export function createFujiChainClient(options: FujiChainClientOptions): ChainClient {
  const account = privateKeyToAccount(options.privateKey);
  const transport = http(options.rpcUrl, { timeout: options.timeoutMs ?? 20_000 });
  const publicClient = createPublicClient({ chain: avalancheFuji, transport });
  const walletClient = createWalletClient({ account, chain: avalancheFuji, transport });
  const explorer = (options.explorerBaseUrl ?? "https://testnet.snowtrace.io").replace(/\/$/, "");
  const timeout = options.timeoutMs ?? 60_000;
  let queue: Promise<unknown> = Promise.resolve();

  const serialized = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };

  const wrap = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
      throw new ChainError(`${label}: ${message}`, err);
    }
  };

  const reference = async (hash: Hex): Promise<ChainReference> => {
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout });
    if (receipt.status !== "success") throw new ChainError(`transaction ${hash} reverted`);
    return { tx_hash: hash, explorer_url: `${explorer}/tx/${hash}`, block_number: Number(receipt.blockNumber) };
  };

  return {
    walletAddress: () => account.address,

    getBalance: () => wrap("getBalance", async () => formatEther(await publicClient.getBalance({ address: account.address }))),

    getAddressInfo: (address) =>
      wrap("getAddressInfo", async (): Promise<AddressInfo> => {
        const target = address as `0x${string}`;
        const [txCount, balance, code] = await Promise.all([
          publicClient.getTransactionCount({ address: target }),
          publicClient.getBalance({ address: target }),
          publicClient.getCode({ address: target }),
        ]);
        return { address: address.toLowerCase(), tx_count: txCount, balance: formatEther(balance), is_contract: !!code && code !== "0x" };
      }),

    executePayment: (decisionId, to, amountAvax, decisionHash) =>
      serialized(() =>
        wrap("pay", async () => {
          const hash = await walletClient.writeContract({
            address: options.contractAddress,
            abi: payGuardLedgerAbi,
            functionName: "pay",
            args: [decisionIdToBytes32(decisionId), to, decisionHash],
            value: parseEther(amountAvax),
          });
          return reference(hash);
        }),
      ),

    recordDecision: (decisionId, verdict: OnChainVerdict, decisionHash) =>
      serialized(() =>
        wrap("record", async () => {
          const hash = await walletClient.writeContract({
            address: options.contractAddress,
            abi: payGuardLedgerAbi,
            functionName: "record",
            args: [decisionIdToBytes32(decisionId), verdict, decisionHash],
          });
          return reference(hash);
        }),
      ),

    setKillSwitch: (active, reason) =>
      serialized(() =>
        wrap("killSwitch", async () => {
          const hash = active
            ? await walletClient.writeContract({ address: options.contractAddress, abi: payGuardLedgerAbi, functionName: "activateKillSwitch", args: [reason] })
            : await walletClient.writeContract({ address: options.contractAddress, abi: payGuardLedgerAbi, functionName: "deactivateKillSwitch" });
          return reference(hash);
        }),
      ),

    isPaused: () => wrap("isPaused", () => publicClient.readContract({ address: options.contractAddress, abi: payGuardLedgerAbi, functionName: "paused" })),

    explorerUrl: (txHash) => `${explorer}/tx/${txHash}`,
  };
}

/** Read a decision back from the contract (used by verify-decision and the proof page). */
export async function readOnChainDecision(rpcUrl: string, contractAddress: `0x${string}`, decisionId: string) {
  const publicClient = createPublicClient({ chain: avalancheFuji, transport: http(rpcUrl) });
  const [verdict, decisionHash, timestamp, to, amount] = await publicClient.readContract({
    address: contractAddress,
    abi: payGuardLedgerAbi,
    functionName: "getDecision",
    args: [decisionIdToBytes32(decisionId)],
  });
  return { verdict, decisionHash, timestamp: Number(timestamp), to, amount: formatEther(amount), recorded: Number(timestamp) > 0 };
}
