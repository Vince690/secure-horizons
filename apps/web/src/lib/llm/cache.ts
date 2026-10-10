import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

/** Stable key for any LLM output: same inputs => same cache row, across demo runs. */
export function cacheKey(namespace: string, parts: unknown[]): string {
  return `${namespace}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

export async function cacheGet(key: string): Promise<string | null> {
  const row = await prisma.explanationCache.findUnique({ where: { decisionHash: key } });
  return row?.text ?? null;
}

export async function cacheSet(key: string, text: string): Promise<void> {
  await prisma.explanationCache.upsert({ where: { decisionHash: key }, update: { text }, create: { decisionHash: key, text } });
}
