/**
 * Startup Health Check - Runs automatically on `npm run dev` to validate system readiness.
 * Fast checks only (< 5 seconds total).
 * 
 * NOTE: This is a read-only health check. No test data is created or modified.
 */
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { config } from "dotenv";

// Load .env from project root before any imports
const envPath = path.resolve(__dirname, "../../../../../.env");
config({ path: envPath });

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// Cleanup: Disconnect Prisma after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe("🚀 Startup Health Check", () => {
  describe("✅ Critical Systems", () => {
    it("should connect to database", async () => {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // DB should respond in < 1s
    }, 2000);

    it("should have demo account", async () => {
      const demo = await prisma.account.findUnique({
        where: { email: "demo@payguard.dev" },
      });

      if (!demo) {
        throw new Error(
          '❌ Demo account not found. Run: npm run db:seed -w apps/web'
        );
      }

      expect(demo).toBeDefined();
      expect(demo.companyName).toBe("Horizon SAS");
    });

    it("should have valid chain configuration", () => {
      if (env.chainMode === "fuji") {
        if (!env.contractAddress) {
          throw new Error(
            "❌ PAYGUARD_CONTRACT_ADDRESS not set. Deploy contract or use CHAIN_MODE=mock"
          );
        }

        if (!env.guardianPrivateKey) {
          throw new Error("❌ GUARDIAN_PRIVATE_KEY not set in .env");
        }

        expect(env.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        expect(env.guardianPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it("should load all rules", async () => {
      const { RULES } = await import("@/lib/guardian/rules");

      if (RULES.length < 20) {
        throw new Error(`❌ Only ${RULES.length} rules loaded, expected 20+`);
      }

      expect(RULES.length).toBeGreaterThanOrEqual(20);
    });

    it("should load compliance rules", async () => {
      const { complianceRule } = await import("@payguard/shared");

      // Test a known rule code
      const rule = complianceRule("KILL_SWITCH_ACTIVE");
      
      if (!rule || !rule.frameworks || rule.frameworks.length === 0) {
        throw new Error("❌ No compliance rules loaded from shared package");
      }

      expect(rule).toBeDefined();
      expect(rule.frameworks).toBeInstanceOf(Array);
      expect(rule.frameworks.length).toBeGreaterThan(0);
    });
  });

  describe("⚠️  Configuration Warnings", () => {
    it("should warn about demo secrets in production", () => {
      if (env.sessionSecret === "change-me-32-chars-minimum-random-string") {
        console.warn("⚠️  WARNING: Using default SESSION_SECRET. Change in .env for production!");
      }
    });

    it("should check LLM configuration", () => {
      if (!env.anthropicApiKey) {
        console.warn(
          "ℹ️  INFO: No ANTHROPIC_API_KEY set. Explanations will use templates only."
        );
      }
    });

    it("should check merchant URLs", () => {
      const merchants = [
        process.env.MERCHANT_LEGIT_URL,
        process.env.MERCHANT_TRAP_URL,
        process.env.MERCHANT_ALT_URL,
      ];

      merchants.forEach((url) => {
        if (!url || !url.includes("localhost:")) {
          console.warn(`⚠️  WARNING: Merchant URL not localhost: ${url}`);
        }
      });
    });
  });

  describe("📊 System Info", () => {
    it("should display startup summary", async () => {
      const accountCount = await prisma.account.count();
      const decisionCount = await prisma.decision.count();
      const { RULES } = await import("@/lib/guardian/rules");

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🛡️  PayGuard System Status");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`✅ Database: Connected (${accountCount} accounts, ${decisionCount} decisions)`);
      console.log(`✅ Chain: ${(env.chainMode || "mock").toUpperCase()} mode`);
      console.log(`✅ Rules: ${RULES.length} loaded`);
      console.log(`✅ LLM: ${env.anthropicApiKey ? "Enabled" : "Disabled (template mode)"}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });
  });
});
