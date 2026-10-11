import { NextResponse } from "next/server";
import type { BalanceResponse } from "@payguard/shared";
import { requireSession } from "@/lib/auth/session";
import { getChainClient } from "@/lib/chain";
import { env } from "@/lib/env";
import { withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getBankAccount } from "@/lib/rails/sandboxIssuer";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  const chain = getChainClient();
  const address = chain.walletAddress();
  const bank = await getBankAccount(account.id);
  const cardsActive = await prisma.virtualCard.count({ where: { accountId: account.id, status: "active" } });
  const body: BalanceResponse & { contract_address: string; contract_url: string } = {
    address,
    balance: await chain.getBalance(),
    chain_id: 43113,
    explorer_url: `${env.snowtraceBaseUrl}/address/${address}`,
    mode: env.chainMode,
    contract_address: env.contractAddress,
    contract_url: env.contractAddress ? `${env.snowtraceBaseUrl}/address/${env.contractAddress}` : "",
    card_rail: { provider: bank.provider, account_label: bank.label, balance: bank.balance, currency: "EUR", cards_active: cardsActive, frozen: bank.frozen },
  };
  return NextResponse.json(body);
});
