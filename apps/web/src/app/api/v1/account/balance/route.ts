import { NextResponse } from "next/server";
import type { BalanceResponse } from "@payguard/shared";
import { authenticateApiKey } from "@/lib/auth/apiKey";
import { getChainClient } from "@/lib/chain";
import { env } from "@/lib/env";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: Request) => {
  await authenticateApiKey(request);
  const chain = getChainClient();
  const address = chain.walletAddress();
  const body: BalanceResponse = {
    address,
    balance: await chain.getBalance(),
    chain_id: 43113,
    explorer_url: `${env.snowtraceBaseUrl}/address/${address}`,
    mode: env.chainMode,
  };
  return NextResponse.json(body);
});
