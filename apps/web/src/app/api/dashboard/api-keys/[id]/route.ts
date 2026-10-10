import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { revokeApiKey } from "@/lib/dashboard/service";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const DELETE = withErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const account = await requireSession();
  const { id } = await params;
  await revokeApiKey(account.id, id);
  return NextResponse.json({ ok: true });
});
