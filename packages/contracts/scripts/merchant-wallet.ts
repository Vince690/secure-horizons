/**
 * Creates the demo MERCHANT wallet (so demo payments can be swept back to the
 * guardian instead of being burnt) and points MERCHANT_LEGIT_ADDRESS at it.
 * Writes MERCHANT_WALLET_PRIVATE_KEY to the root .env. Prints only addresses.
 *   npm run merchant-wallet -w packages/contracts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const envPath = path.resolve(__dirname, "../../../.env");
let env = readFileSync(envPath, "utf8");
const setVar = (key: string, value: string) => {
  env = new RegExp(`^${key}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`) : env + `\n${key}=${value}\n`;
};
let pk = env.match(/^MERCHANT_WALLET_PRIVATE_KEY=(0x[0-9a-fA-F]{64})$/m)?.[1];
if (!pk) {
  pk = generatePrivateKey();
  setVar("MERCHANT_WALLET_PRIVATE_KEY", pk);
  console.log("New merchant wallet created (private key written to .env).");
} else {
  console.log("Merchant wallet already exists in .env.");
}
const address = privateKeyToAccount(pk as `0x${string}`).address;
setVar("MERCHANT_LEGIT_ADDRESS", address);
writeFileSync(envPath, env, { mode: 0o600 });
console.log(`  MERCHANT_LEGIT_ADDRESS=${address}`);
console.log("Next: npm run db:seed -w apps/web (trusts this address), restart dev:web and dev:merchants.");
