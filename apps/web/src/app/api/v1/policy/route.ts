import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth/apiKey";
import { withErrorHandling } from "@/lib/http";
import { loadPolicy } from "@/lib/guardian/service";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const account = await authenticateApiKey(request);
  return NextResponse.json(await loadPolicy(account.id));
});
