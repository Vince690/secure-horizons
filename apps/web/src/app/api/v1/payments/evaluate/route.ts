import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth/apiKey";
import { HttpError, withErrorHandling } from "@/lib/http";
import { processPaymentRequest } from "@/lib/guardian/service";
import { evaluatePaymentSchema } from "@/lib/guardian/validation";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  const account = await authenticateApiKey(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError("INVALID_REQUEST", "Body must be JSON");
  }
  const parsed = evaluatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError("INVALID_REQUEST", "Invalid payment request", parsed.error.flatten());
  }
  const { decision, replayed } = await processPaymentRequest(account, parsed.data);
  return NextResponse.json(decision, { status: 200, headers: replayed ? { "x-payguard-replayed": "true" } : {} });
});
