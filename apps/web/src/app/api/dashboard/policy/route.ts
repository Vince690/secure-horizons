import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { updatePolicy } from "@/lib/dashboard/service";
import { policySchema } from "@/lib/dashboard/validation";
import { loadPolicy } from "@/lib/guardian/service";
import { HttpError, withErrorHandling } from "@/lib/http";
import { readJson } from "@/lib/dashboard/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json(await loadPolicy(account.id));
});

export const PUT = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const parsed = policySchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "Invalid policy", parsed.error.flatten());
  return NextResponse.json(await updatePolicy(account.id, parsed.data));
});
