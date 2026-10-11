import { NextResponse } from "next/server";
import { z } from "zod";
import { appendAudit } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { readJson } from "@/lib/dashboard/http";
import { HttpError, withErrorHandling } from "@/lib/http";
import { authorizeCard } from "@/lib/rails/sandboxIssuer";

export const dynamic = "force-dynamic";

const schema = z.object({ amount: z.string().regex(/^\d+(\.\d+)?$/), merchant: z.string().min(1).max(200) });

/** Sandbox only: simulates the merchant charging the single-use card. */
export const POST = withErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const account = await requireSession();
  const { id } = await params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "amount and merchant required", parsed.error.flatten());
  const result = await authorizeCard(account.id, id, parsed.data.amount, parsed.data.merchant);
  await appendAudit(account.id, result.authorization.approved ? "PAYMENT_EXECUTED" : "PAYMENT_FAILED", {
    card_id: id,
    last4: result.card.last4,
    rail: "virtual_card",
    authorization: result.authorization,
  });
  return NextResponse.json(result);
});
