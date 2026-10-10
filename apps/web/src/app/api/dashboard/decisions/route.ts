import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { listDecisions } from "@/lib/dashboard/service";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  return NextResponse.json({ decisions: await listDecisions(account.id, status, limit) });
});
