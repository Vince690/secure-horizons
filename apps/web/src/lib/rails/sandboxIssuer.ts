import { randomBytes, randomUUID } from "node:crypto";
import type { VirtualCard as VirtualCardRow } from "@prisma/client";
import type { VirtualCardSummary } from "@payguard/shared";
import { prisma } from "@/lib/db";

/**
 * Sandbox card issuer: stands in for the client's bank ("connect your bank").
 * Its surface mirrors the shape of a business banking cards API (Revolut
 * Business-style: create a virtual card with a single-transaction limit,
 * freeze, terminate, authorize). Swap it for the real adapter later; nothing
 * else in PayGuard changes. The full PAN is generated and immediately
 * forgotten: only last4 is stored. Nobody, agent or dashboard, can read it.
 */
const CARD_TTL_MINUTES = 60;
const DEFAULT_SANDBOX_BALANCE = process.env.SANDBOX_BANK_BALANCE ?? "500.00";

function luhnPan(): string {
  // Test BIN 400000 (never a real card), 15 digits + Luhn check digit.
  const digits = "400000" + Array.from(randomBytes(9), (b) => (b % 10).toString()).join("");
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(digits[i]);
    if ((15 - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits + ((10 - (sum % 10)) % 10).toString();
}

export async function getBankAccount(accountId: string) {
  return prisma.bankAccount.upsert({ where: { accountId }, update: {}, create: { accountId, balance: DEFAULT_SANDBOX_BALANCE } });
}

export function toCardSummary(row: VirtualCardRow): VirtualCardSummary {
  return {
    card_id: row.id,
    provider: row.provider,
    brand: row.brand,
    last4: row.last4,
    masked: `**** **** **** ${row.last4}`,
    expiry: row.expiry,
    limit_amount: row.limitAmount,
    currency: row.currency as "EUR",
    merchant_lock: row.merchantLock,
    single_use: true,
    status: row.status as VirtualCardSummary["status"],
    issued_at: row.issuedAt.toISOString(),
    expires_at: row.expiresAt.toISOString(),
    last_authorization: row.lastAuthJson ? JSON.parse(row.lastAuthJson) : null,
  };
}

export interface IssueCardParams {
  accountId: string;
  decisionId: string;
  amount: string;
  merchantLock: string | null;
}

/** POST /cards { virtual: true, spending_limits: { single: amount } } in Revolut terms. */
export async function issueCard(params: IssueCardParams): Promise<VirtualCardSummary> {
  const bank = await getBankAccount(params.accountId);
  if (bank.frozen) throw new Error("bank account frozen (kill switch)");
  if (Number(bank.balance) < Number(params.amount)) throw new Error("insufficient bank balance");
  const pan = luhnPan(); // generated, used to derive last4, then dropped
  const now = new Date();
  const exp = new Date(now.getTime() + CARD_TTL_MINUTES * 60_000);
  const expiry = `${String(exp.getMonth() + 1).padStart(2, "0")}/${String(exp.getFullYear() % 100).padStart(2, "0")}`;
  const row = await prisma.virtualCard.create({
    data: {
      id: `card_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      accountId: params.accountId,
      decisionId: params.decisionId,
      last4: pan.slice(-4),
      expiry,
      limitAmount: params.amount,
      merchantLock: params.merchantLock,
      expiresAt: exp,
    },
  });
  return toCardSummary(row);
}

/**
 * The merchant charges the card (sandbox authorization). Approved only if the
 * card is active, not expired, the amount is within the cap and the merchant
 * matches the lock. Approval marks the card used and debits the bank balance.
 */
export async function authorizeCard(accountId: string, cardId: string, amount: string, merchant: string) {
  const row = await prisma.virtualCard.findFirst({ where: { id: cardId, accountId } });
  if (!row) throw new Error("card not found");
  const bank = await getBankAccount(accountId);
  let approved = false;
  let reason: string;
  if (bank.frozen || row.status === "frozen") reason = "carte gelée (kill switch)";
  else if (row.status === "used") reason = "carte déjà utilisée (usage unique)";
  else if (row.status !== "active") reason = `carte ${row.status}`;
  else if (row.expiresAt.getTime() < Date.now()) reason = "carte expirée";
  else if (Number(amount) > Number(row.limitAmount)) reason = `montant ${amount} € au-dessus du plafond ${row.limitAmount} €`;
  else if (row.merchantLock && !merchant.toLowerCase().includes(row.merchantLock.toLowerCase()) && !row.merchantLock.toLowerCase().includes(merchant.toLowerCase())) reason = `marchand ${merchant} différent du marchand verrouillé ${row.merchantLock}`;
  else {
    approved = true;
    reason = "autorisé";
  }
  const auth = { amount, merchant, approved, reason, at: new Date().toISOString() };
  const updated = await prisma.virtualCard.update({
    where: { id: row.id },
    data: { lastAuthJson: JSON.stringify(auth), ...(approved ? { status: "used" } : {}) },
  });
  if (approved) {
    await prisma.bankAccount.update({ where: { accountId }, data: { balance: (Number(bank.balance) - Number(amount)).toFixed(2) } });
  }
  return { card: toCardSummary(updated), authorization: auth };
}

export async function cancelCard(accountId: string, cardId: string) {
  const row = await prisma.virtualCard.findFirst({ where: { id: cardId, accountId } });
  if (!row) throw new Error("card not found");
  return toCardSummary(await prisma.virtualCard.update({ where: { id: row.id }, data: { status: "cancelled" } }));
}

/** Kill switch on the card rail: freeze the bank link and every active card, or thaw them. */
export async function setCardsFrozen(accountId: string, frozen: boolean) {
  await getBankAccount(accountId);
  await prisma.bankAccount.update({ where: { accountId }, data: { frozen } });
  if (frozen) await prisma.virtualCard.updateMany({ where: { accountId, status: "active" }, data: { status: "frozen" } });
  else await prisma.virtualCard.updateMany({ where: { accountId, status: "frozen" }, data: { status: "active" } });
}

export async function listCards(accountId: string, limit = 50): Promise<VirtualCardSummary[]> {
  const rows = await prisma.virtualCard.findMany({ where: { accountId }, orderBy: { issuedAt: "desc" }, take: limit });
  return rows.map(toCardSummary);
}

export async function cardForDecision(decisionId: string): Promise<VirtualCardSummary | null> {
  const row = await prisma.virtualCard.findUnique({ where: { decisionId } });
  return row ? toCardSummary(row) : null;
}
