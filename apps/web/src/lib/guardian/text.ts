import type { ConversationMessage } from "@payguard/shared";
import type { GuardianContext } from "./types";

export const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/g;

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

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

/** Lowercase word tokens of 4+ letters/digits, accents stripped. */
export function tokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = i;
    let diag = i - 1;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(up + 1, left + 1, diag + cost);
      diag = up;
      prev[j] = value;
      left = value;
    }
    prev[0] = i;
  }
  return prev[b.length];
}

/** Collapse the classic homoglyph swaps used in lookalike domains. */
export function homoglyphNormalize(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/rn/g, "m")
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/[^a-z]/g, "");
}

/** Registrable label without TLD: "n0rdsound-deals.shop" -> "n0rdsound-deals". */
export function domainLabel(domain: string): string {
  const parts = domain.toLowerCase().replace(/^www\./, "").split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : parts[0];
}
