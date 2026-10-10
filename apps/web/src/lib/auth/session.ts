import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Account } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";

export const SESSION_COOKIE = "payguard_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sign(payload: string): string {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");
}

/** token = base64url(JSON{sub, exp}).signature */
export function createSessionToken(accountId: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub: string; exp: number };
    return exp > Date.now() ? sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(accountId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(accountId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The logged-in account, or null. Works in route handlers and server components. */
export async function getSessionAccount(): Promise<Account | null> {
  const store = await cookies();
  const accountId = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!accountId) return null;
  return prisma.account.findUnique({ where: { id: accountId } });
}

export async function requireSession(): Promise<Account> {
  const account = await getSessionAccount();
  if (!account) throw new HttpError("UNAUTHORIZED", "Not logged in");
  return account;
}
