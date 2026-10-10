import { NextResponse } from "next/server";
import { listAudit, verifyAuditChain } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));
  const [entries, chain] = await Promise.all([listAudit(account.id, limit), verifyAuditChain(account.id)]);
  return NextResponse.json({ entries, chain });
});
