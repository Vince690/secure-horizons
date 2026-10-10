import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { approveDecision } from "@/lib/dashboard/service";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const account = await requireSession();
  const { id } = await params;
  return NextResponse.json(await approveDecision(account.id, id));
});
