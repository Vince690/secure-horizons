import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";
import { getMetrics } from "@/lib/analytics/metrics";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 30) || 30));
  return NextResponse.json(await getMetrics(account.id, days));
});
