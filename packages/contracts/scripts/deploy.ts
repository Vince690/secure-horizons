/**
 * Deploys PayGuardLedger on Fuji, makes one tiny first payment so the demo has
 * a visible transaction, and writes the address to deployments/fuji.json.
 * Run: npm run deploy:fuji -w packages/contracts   (needs GUARDIAN_PRIVATE_KEY in root .env)
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import hre from "hardhat";
import { formatEther, keccak256, parseEther, toBytes, toHex } from "viem";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  if (!deployer) throw new Error("No deployer account: set GUARDIAN_PRIVATE_KEY in the root .env");
  const publicClient = await hre.viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  if (chainId !== 43113) throw new Error(`Refusing to deploy on chain ${chainId}: Fuji (43113) only`);

  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log(`Deployer ${deployer.account.address} balance: ${formatEther(balance)} AVAX`);
  if (balance < parseEther("0.03")) throw new Error("Balance under 0.03 AVAX: top up at https://core.app/tools/testnet-faucet/ first");

  const ledger = await hre.viem.deployContract("PayGuardLedger");
  console.log(`PayGuardLedger deployed at ${ledger.address}`);
  console.log(`  https://testnet.snowtrace.io/address/${ledger.address}`);

  const legit = (process.env.MERCHANT_LEGIT_ADDRESS ?? "0x1111111111111111111111111111111111111111") as `0x${string}`;
  const firstHash = toHex(new Uint8Array(32).fill(0x01));
  const tx = await ledger.write.pay([keccak256(toBytes("deploy-smoke")), legit, firstHash], { value: parseEther("0.001") });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log(`First payment (0.001 AVAX to demo merchant): https://testnet.snowtrace.io/tx/${tx}`);

  const out = {
    network: "fuji",
    chainId,
    contract: "PayGuardLedger",
    address: ledger.address,
    deployer: deployer.account.address,
    deployedAt: new Date().toISOString(),
    firstPaymentTx: tx,
    explorer: `https://testnet.snowtrace.io/address/${ledger.address}`,
  };
  const file = path.resolve(__dirname, "../deployments/fuji.json");
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`Written ${file}`);
  console.log("");
  console.log("Next: set in the root .env");
  console.log(`  PAYGUARD_CONTRACT_ADDRESS=${ledger.address}`);
  console.log("  CHAIN_MODE=fuji");
  console.log("and record the address in README.md (table « Contrat déployé »).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
