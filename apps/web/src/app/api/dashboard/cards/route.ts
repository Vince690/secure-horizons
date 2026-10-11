import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";
import { listCards } from "@/lib/rails/sandboxIssuer";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json({ cards: await listCards(account.id) });
});
