import type { ChainReference, KillSwitchState } from "@payguard/shared";
import { appendAudit } from "@/lib/audit";
import { getChainClient } from "@/lib/chain";
import { prisma } from "@/lib/db";
import { toKillSwitchDto } from "@/lib/mappers";

/**
 * Kill switch = DB flag (primary gate for the API) + on-chain pause (defense
 * in depth). Used by the dashboard (by = "human") and by the guardian itself
 * (by = "auto") when it detects a critical pattern.
 */
export async function setKillSwitch(accountId: string, active: boolean, reason: string, by: "human" | "auto"): Promise<KillSwitchState & { onchain_error: string | null }> {
  const chain = getChainClient();
  let onchainTx: ChainReference | null = null;
  let onchainError: string | null = null;
  try {
    onchainTx = await chain.setKillSwitch(active, reason);
  } catch (err) {
    onchainError = err instanceof Error ? err.message : String(err);
    console.error("[killswitch] chain error", err);
  }
  const row = await prisma.killSwitch.upsert({
    where: { accountId },
    update: { active, reason: active ? reason : null, activatedAt: active ? new Date() : null, onchainTxJson: onchainTx ? JSON.stringify(onchainTx) : null },
    create: { accountId, active, reason: active ? reason : null, activatedAt: active ? new Date() : null, onchainTxJson: onchainTx ? JSON.stringify(onchainTx) : null },
  });
  await appendAudit(accountId, active ? "KILL_SWITCH_ON" : "KILL_SWITCH_OFF", { reason, by, onchain_tx: onchainTx?.tx_hash ?? null, onchain_error: onchainError });
  return { ...toKillSwitchDto(row), onchain_error: onchainError };
}

const WINDOW_MS = 10 * 60 * 1000;
const BLOCKED_THRESHOLD = 3;

/**
 * Automatic trigger (docs/API.md §5): 3 BLOCKED decisions in 10 minutes, or a
 * critical injection combined with an amount above the per-payment limit.
 * Returns the reason when it fired, null otherwise.
 */
export async function maybeAutoKillSwitch(input: {
  accountId: string;
  decisionId: string;
  verdict: string;
  reasonCodes: string[];
  amountOverTxLimit: boolean;
  alreadyActive: boolean;
}): Promise<string | null> {
  if (input.alreadyActive || input.verdict !== "BLOCKED") return null;
  const injection = input.reasonCodes.includes("PROMPT_INJECTION_SUSPECTED") || input.reasonCodes.includes("HIDDEN_INSTRUCTIONS");
  let reason: string | null = null;
  if (injection && input.amountOverTxLimit) {
    reason = `auto: injection critique avec montant hors plafond (décision ${input.decisionId})`;
  } else {
    // Count only since the last re-arm: a human who just re-armed must not be
    // tripped again by the blocked decisions that caused the previous trip.
    const row = await prisma.killSwitch.findUnique({ where: { accountId: input.accountId } });
    const windowStart = Date.now() - WINDOW_MS;
    const lastRearm = row && !row.active ? row.updatedAt.getTime() : 0;
    const since = new Date(Math.max(windowStart, lastRearm));
    const blocked = await prisma.decision.count({ where: { accountId: input.accountId, status: "BLOCKED", createdAt: { gte: since } } });
    if (blocked >= BLOCKED_THRESHOLD) reason = `auto: ${blocked} paiements bloqués en moins de 10 minutes (dernier : ${input.decisionId})`;
  }
  if (!reason) return null;
  await setKillSwitch(input.accountId, true, reason, "auto");
  console.warn(`[killswitch] AUTO-ACTIVATED for ${input.accountId}: ${reason}`);
  return reason;
}
