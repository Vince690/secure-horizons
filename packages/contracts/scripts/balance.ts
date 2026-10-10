/** Prints the guardian wallet balance on Fuji. npm run balance -w packages/contracts */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createPublicClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

loadEnv({ path: path.resolve(__dirname, "../../../.env") });
const pk = process.env.GUARDIAN_PRIVATE_KEY?.trim();
if (!pk) {
  console.log("GUARDIAN_PRIVATE_KEY missing: run npx tsx packages/contracts/scripts/new-wallet.ts");
  process.exit(1);
}
const address = privateKeyToAccount(pk as `0x${string}`).address;
const client = createPublicClient({ chain: avalancheFuji, transport: http(process.env.FUJI_RPC_URL) });
client.getBalance({ address }).then((b) => {
  console.log(`${address}: ${formatEther(b)} AVAX on Fuji (${b >= 200000000000000000n ? "enough to deploy" : "need >= 0.2 AVAX: use the faucet"})`);
});
