import { createHash, randomBytes } from "node:crypto";
import type { Account } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";

export const API_KEY_PREFIX = "pg_test_";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Returns the clear key (show it once) and what to store. */
export function generateApiKey(): { key: string; keyHash: string; prefix: string } {
  const key = `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return { key, keyHash: hashApiKey(key), prefix: key.slice(0, 12) };
}

/** Resolve `Authorization: Bearer pg_test_...` to an account, or throw 401. */
export async function authenticateApiKey(request: Request): Promise<Account> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match || !match[1].startsWith(API_KEY_PREFIX)) {
    throw new HttpError("UNAUTHORIZED", "Invalid or missing API key");
  }
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(match[1]) },
    include: { account: true },
  });
  if (!apiKey || apiKey.revokedAt) {
    throw new HttpError("UNAUTHORIZED", "Invalid or missing API key");
  }
  return apiKey.account;
}
