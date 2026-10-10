import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
