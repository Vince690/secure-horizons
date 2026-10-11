import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { listOrders } from "@/lib/dashboard/orders";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json({ orders: await listOrders(account.id) });
});
