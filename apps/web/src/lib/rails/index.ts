import type { Currency, Rail, RailLimits, SpendingPolicy } from "@payguard/shared";
import { getChainClient } from "@/lib/chain";
import { createAvalancheRail } from "./avalanche";
import { createVirtualCardRail } from "./virtualCard";
import type { PaymentRail } from "./types";

export type { PaymentRail, PaymentOrder, PaymentReceipt } from "./types";

const globalForRails = globalThis as unknown as { rails?: Record<Rail, PaymentRail> };

export function getRail(kind: Rail): PaymentRail {
  if (!globalForRails.rails) {
    const chain = getChainClient();
    globalForRails.rails = { avalanche: createAvalancheRail(chain), virtual_card: createVirtualCardRail(chain) };
  }
  return globalForRails.rails[kind];
}

export function railForCurrency(currency: Currency): Rail {
  return currency === "EUR" ? "virtual_card" : "avalanche";
}

/** The mandate the engine must apply for a given rail (its own currency). */
export function limitsForRail(policy: SpendingPolicy, rail: Rail): RailLimits {
  if (rail === "virtual_card") return policy.card;
  return { max_per_tx: policy.max_per_tx, max_daily: policy.max_daily, min_balance: policy.min_balance, require_confirmation_above: policy.require_confirmation_above };
}

/** A SpendingPolicy view where the top-level limits are the rail's limits. */
export function policyForRail(policy: SpendingPolicy, rail: Rail): SpendingPolicy {
  return { ...policy, ...limitsForRail(policy, rail) };
}
