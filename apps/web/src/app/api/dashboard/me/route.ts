import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { toAccountDto } from "@/lib/dashboard/service";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json({ account: toAccountDto(account) });
});
