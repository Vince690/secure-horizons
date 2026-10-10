/**
 * Seeds the demo account. Run: npm run db:seed -w apps/web
 * Prints the API key ONCE. Put it in the root .env as PAYGUARD_API_KEY.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_POLICY } from "@payguard/shared";
import { generateApiKey } from "../src/lib/auth/apiKey";
import { toPolicyRow } from "../src/lib/mappers";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@payguard.dev";
const DEMO_PASSWORD = "demo1234";
const LEGIT_ADDRESS = (process.env.MERCHANT_LEGIT_ADDRESS ?? "0x1111111111111111111111111111111111111111").toLowerCase();
const LEGIT_DOMAIN = process.env.MERCHANT_LEGIT_DOMAIN ?? "nordsound.shop";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const account = await prisma.account.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, companyName: "Horizon SAS" },
  });

  const policyRow = toPolicyRow(account.id, {
    ...DEFAULT_POLICY,
    trusted_recipients: [LEGIT_ADDRESS],
    trusted_domains: [LEGIT_DOMAIN],
  });
  await prisma.policy.upsert({ where: { accountId: account.id }, update: policyRow, create: policyRow });

  await prisma.recipient.upsert({
    where: { accountId_address: { accountId: account.id, address: LEGIT_ADDRESS } },
    update: { trusted: true },
    create: { accountId: account.id, address: LEGIT_ADDRESS, name: "NordSound", domain: LEGIT_DOMAIN, trusted: true },
  });

  await prisma.killSwitch.upsert({
    where: { accountId: account.id },
    update: {},
    create: { accountId: account.id, active: false },
  });

  const { key, keyHash, prefix } = generateApiKey();
  await prisma.apiKey.create({ data: { accountId: account.id, keyHash, prefix, label: "seed" } });

  console.log("");
  console.log("Demo account ready");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  company:  Horizon SAS`);
  console.log("");
  console.log("API key (shown once, copy it to the root .env as PAYGUARD_API_KEY):");
  console.log(`  ${key}`);
  console.log("");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
