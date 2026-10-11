import type { ConversationMessage } from "@payguard/shared";
import { HIDDEN_BLOCK_RE } from "@payguard/shared";
import type { GuardianContext } from "./types";

// Shared with the MCP tools: same lookalike logic, same markers.
export { EVM_ADDRESS_RE, HIDDEN_BLOCK_RE, normalizeAddress, tokens, levenshtein, homoglyphNormalize, domainLabel, findLookalike } from "@payguard/shared";

export function userMessages(ctx: GuardianContext): ConversationMessage[] {
  return (ctx.request.context?.conversation ?? []).filter((m) => m.role === "user");
}

export function nonUserMessages(ctx: GuardianContext): ConversationMessage[] {
  return (ctx.request.context?.conversation ?? []).filter((m) => m.role !== "user");
}

/** Text the agent did NOT get from the user: page content + tool/assistant turns. */
export function untrustedText(ctx: GuardianContext): string {
  const page = ctx.request.context?.page_excerpt ?? "";
  const others = nonUserMessages(ctx).map((m) => m.content).join("\n");
  return `${page}\n${others}`;
}

/** The page text with every hidden block removed: what a human visitor saw. */
export function visiblePageText(ctx: GuardianContext): string {
  return (ctx.request.context?.page_excerpt ?? "").replace(HIDDEN_BLOCK_RE, " ");
}

/** Each hidden block of the page, with the reason it was invisible. */
export function hiddenPageBlocks(ctx: GuardianContext): Array<{ why: string; text: string }> {
  const page = ctx.request.context?.page_excerpt ?? "";
  return [...page.matchAll(HIDDEN_BLOCK_RE)].map((m) => ({ why: m[1], text: m[2].trim() }));
}

/** Prices in a text for one currency ("0.04 AVAX", "49,90 €", "EUR 49.90"), as 18-decimal integers. */
export function pricesIn(text: string, currency: "AVAX" | "EUR" = "AVAX"): bigint[] {
  const out: bigint[] = [];
  if (currency === "AVAX") {
    for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s?AVAX\b/gi)) out.push(parseAvaxLoose(m[1]));
  } else {
    for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s?(?:€|\bEUR\b)/g)) out.push(parseAvaxLoose(m[1]));
    for (const m of text.matchAll(/(?:€|\bEUR\b)\s?(\d+(?:[.,]\d+)?)/g)) out.push(parseAvaxLoose(m[1]));
  }
  return out;
}

function parseAvaxLoose(value: string): bigint {
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}
