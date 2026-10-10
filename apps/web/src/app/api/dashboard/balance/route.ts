import { NextResponse } from "next/server";
import type { BalanceResponse } from "@payguard/shared";
import { requireSession } from "@/lib/auth/session";
import { getChainClient } from "@/lib/chain";
import { env } from "@/lib/env";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  await requireSession();
  const chain = getChainClient();
  const address = chain.walletAddress();
  const body: BalanceResponse & { contract_address: string; contract_url: string } = {
    address,
    balance: await chain.getBalance(),
    chain_id: 43113,
    explorer_url: `${env.snowtraceBaseUrl}/address/${address}`,
    mode: env.chainMode,
    contract_address: env.contractAddress,
    contract_url: env.contractAddress ? `${env.snowtraceBaseUrl}/address/${env.contractAddress}` : "",
  };
  return NextResponse.json(body);
});
