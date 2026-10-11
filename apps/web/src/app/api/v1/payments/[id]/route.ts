import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth/apiKey";
import { prisma } from "@/lib/db";
import { HttpError, withErrorHandling } from "@/lib/http";
import { toDecisionDto } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const account = await authenticateApiKey(request);
  const { id } = await params;
  const row = await prisma.decision.findFirst({ where: { id, accountId: account.id } });
  if (!row) throw new HttpError("NOT_FOUND", `Decision ${id} not found`);
  const card = row.rail === "virtual_card" ? await prisma.virtualCard.findUnique({ where: { decisionId: row.id } }) : null;
  return NextResponse.json(toDecisionDto(row, card));
});
