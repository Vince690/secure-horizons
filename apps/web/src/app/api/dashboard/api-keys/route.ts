import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createApiKey, listApiKeys } from "@/lib/dashboard/service";
import { apiKeySchema } from "@/lib/dashboard/validation";
import { HttpError, withErrorHandling } from "@/lib/http";
import { readJson } from "@/lib/dashboard/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json({ api_keys: await listApiKeys(account.id) });
});

export const POST = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const parsed = apiKeySchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "Invalid label", parsed.error.flatten());
  return NextResponse.json(await createApiKey(account.id, parsed.data.label), { status: 201 });
});
