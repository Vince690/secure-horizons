import { NextResponse } from "next/server";
import { listAudit, verifyAuditChain } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  const [entries, chain] = await Promise.all([listAudit(account.id, 100000), verifyAuditChain(account.id)]);
  const body = { exportedAt: new Date().toISOString(), account: account.id, chain, entries };
  const filename = `payguard-audit-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
