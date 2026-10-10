import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getDecision } from "@/lib/dashboard/service";
import { withErrorHandling } from "@/lib/http";
import { toDecisionDto } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const account = await requireSession();
  const { id } = await params;
  const row = await getDecision(account.id, id);
  const context = row.contextJson ? JSON.parse(row.contextJson) : null;
  return NextResponse.json({ ...toDecisionDto(row), context });
});
