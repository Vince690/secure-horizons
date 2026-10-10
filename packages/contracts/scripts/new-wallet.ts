/**
 * Creates a DEDICATED hackathon wallet and writes its private key to the root
 * .env (GUARDIAN_PRIVATE_KEY). Prints only the public address.
 * Refuses to overwrite an existing key. Testnet only: these funds have no value.
 *
 *   npx tsx packages/contracts/scripts/new-wallet.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const envPath = path.resolve(__dirname, "../../../.env");
const env = readFileSync(envPath, "utf8");
const existing = env.match(/^GUARDIAN_PRIVATE_KEY=(.*)$/m)?.[1]?.trim();
if (existing) {
  const address = privateKeyToAccount(existing as `0x${string}`).address;
  console.log(`GUARDIAN_PRIVATE_KEY is already set in .env. Wallet address: ${address}`);
  process.exit(0);
}

const privateKey = generatePrivateKey();
const address = privateKeyToAccount(privateKey).address;
const updated = /^GUARDIAN_PRIVATE_KEY=.*$/m.test(env)
  ? env.replace(/^GUARDIAN_PRIVATE_KEY=.*$/m, `GUARDIAN_PRIVATE_KEY=${privateKey}`)
  : env + `\nGUARDIAN_PRIVATE_KEY=${privateKey}\n`;
writeFileSync(envPath, updated, { mode: 0o600 });

console.log("New hackathon wallet created. Private key written to .env (never commit it, never paste it anywhere).");
console.log("");
console.log(`  Public address: ${address}`);
console.log(`  Explorer:       https://testnet.snowtrace.io/address/${address}`);
console.log("");
console.log("Next: get free test AVAX at https://build.avax.network/console/primary-network/faucet");
