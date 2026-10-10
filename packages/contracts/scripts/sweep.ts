/**
 * Sends the demo merchant wallet's balance (minus gas) back to the guardian
 * wallet, so demo payments are recycled instead of lost. Testnet only.
 *   npm run sweep -w packages/contracts
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

loadEnv({ path: path.resolve(__dirname, "../../../.env") });
const merchantPk = process.env.MERCHANT_WALLET_PRIVATE_KEY?.trim();
const guardianPk = process.env.GUARDIAN_PRIVATE_KEY?.trim();
if (!merchantPk || !guardianPk) {
  console.log("MERCHANT_WALLET_PRIVATE_KEY or GUARDIAN_PRIVATE_KEY missing in .env");
  process.exit(1);
}
const merchant = privateKeyToAccount(merchantPk as `0x${string}`);
const guardian = privateKeyToAccount(guardianPk as `0x${string}`).address;
const transport = http(process.env.FUJI_RPC_URL);
const publicClient = createPublicClient({ chain: avalancheFuji, transport });
const wallet = createWalletClient({ account: merchant, chain: avalancheFuji, transport });

async function main() {
  const balance = await publicClient.getBalance({ address: merchant.address });
  const gasPrice = await publicClient.getGasPrice();
  const fee = gasPrice * 21_000n * 2n;
  if (balance <= fee) {
    console.log(`Merchant wallet ${merchant.address} holds ${formatEther(balance)} AVAX: nothing to sweep.`);
    return;
  }
  const value = balance - fee;
  const hash = await wallet.sendTransaction({ to: guardian, value, gas: 21_000n, gasPrice });
  await publicClient.waitForTransactionReceipt({ hash });
  const after = await publicClient.getBalance({ address: guardian });
  console.log(`Swept ${formatEther(value)} AVAX from merchant ${merchant.address} back to guardian ${guardian}.`);
  console.log(`  tx: https://testnet.snowtrace.io/tx/${hash}`);
  console.log(`  guardian balance now: ${formatEther(after)} AVAX`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
