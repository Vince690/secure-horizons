import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth/apiKey";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/http";
import { toDecisionDto } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  const account = await authenticateApiKey(request);
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  const rows = await prisma.decision.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, take: limit });
  return NextResponse.json({ decisions: rows.map((r) => toDecisionDto(r)) });
});
