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
const guardianPk = process.env.GUARDIAN_PRIVATE_KEY?.trim();
if (!guardianPk) {
  console.log("GUARDIAN_PRIVATE_KEY missing in .env");
  process.exit(1);
}
const guardian = privateKeyToAccount(guardianPk as `0x${string}`).address;
const transport = http(process.env.FUJI_RPC_URL);
const publicClient = createPublicClient({ chain: avalancheFuji, transport });

async function sweepOne(label: string, pk: string | undefined) {
  if (!pk) return;
  const merchant = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account: merchant, chain: avalancheFuji, transport });
  const balance = await publicClient.getBalance({ address: merchant.address });
  const gasPrice = await publicClient.getGasPrice();
  const fee = gasPrice * 21_000n * 2n;
  if (balance <= fee) {
    console.log(`${label} ${merchant.address}: ${formatEther(balance)} AVAX, nothing to sweep.`);
    return;
  }
  const value = balance - fee;
  const hash = await wallet.sendTransaction({ to: guardian, value, gas: 21_000n, gasPrice });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`${label}: swept ${formatEther(value)} AVAX back to the guardian. https://testnet.snowtrace.io/tx/${hash}`);
}

async function main() {
  await sweepOne("NordSound", process.env.MERCHANT_WALLET_PRIVATE_KEY?.trim());
  await sweepOne("AudioPlanet", process.env.MERCHANT_ALT_WALLET_PRIVATE_KEY?.trim());
  console.log(`Guardian ${guardian} balance now: ${formatEther(await publicClient.getBalance({ address: guardian }))} AVAX`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
