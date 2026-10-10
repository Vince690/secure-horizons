import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { AuditEntry, AuditEventType } from "@payguard/shared";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const GENESIS = "0".repeat(64);

export function auditHash(seq: number, event: string, accountId: string, payloadJson: string, prevHash: string): string {
  return createHash("sha256").update(`${seq}|${event}|${accountId}|${payloadJson}|${prevHash}`).digest("hex");
}

/**
 * Append one hash-chained entry: in the DB (queryable) and in logs/audit.jsonl
 * (the "internal log file" the team asked for). The chain lets anyone prove
 * that no entry was removed or edited afterwards.
 */
export async function appendAudit(accountId: string, event: AuditEventType, payload: unknown): Promise<AuditEntry> {
  const payloadJson = JSON.stringify(payload ?? null);
  const last = await prisma.auditEntry.findFirst({ where: { accountId }, orderBy: { seq: "desc" } });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.hash ?? GENESIS;
  const hash = auditHash(seq, event, accountId, payloadJson, prevHash);
  const row = await prisma.auditEntry.create({ data: { accountId, seq, event, payloadJson, prevHash, hash } });

  const entry: AuditEntry = {
    seq,
    event,
    account_id: accountId,
    payload: JSON.parse(payloadJson),
    prev_hash: prevHash,
    hash,
    created_at: row.createdAt.toISOString(),
  };
  try {
    const file = path.resolve(process.cwd(), env.auditLogPath);
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("[audit] could not write log file", err);
  }
  return entry;
}

export async function listAudit(accountId: string, limit = 100): Promise<AuditEntry[]> {
  const rows = await prisma.auditEntry.findMany({ where: { accountId }, orderBy: { seq: "desc" }, take: limit });
  return rows.map((r) => ({
    seq: r.seq,
    event: r.event as AuditEventType,
    account_id: r.accountId,
    payload: JSON.parse(r.payloadJson),
    prev_hash: r.prevHash,
    hash: r.hash,
    created_at: r.createdAt.toISOString(),
  }));
}

/** Recompute every hash from genesis; returns the first broken seq, or null if intact. */
export async function verifyAuditChain(accountId: string): Promise<{ intact: boolean; brokenAt: number | null; length: number }> {
  const rows = await prisma.auditEntry.findMany({ where: { accountId }, orderBy: { seq: "asc" } });
  let prev = GENESIS;
  for (const r of rows) {
    if (r.prevHash !== prev || auditHash(r.seq, r.event, accountId, r.payloadJson, r.prevHash) !== r.hash) {
      return { intact: false, brokenAt: r.seq, length: rows.length };
    }
    prev = r.hash;
  }
  return { intact: true, brokenAt: null, length: rows.length };
}
