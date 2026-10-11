/**
 * Database cleanup verification test.
 * Ensures test data is properly cleaned up and doesn't pollute the database.
 */
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { config } from "dotenv";

const envPath = path.resolve(__dirname, "../../../../../.env");
config({ path: envPath });

import { prisma } from "@/lib/db";
import { cleanupTestData, verifyDatabaseState, safeDisconnect } from "./test-helpers";

describe("🧹 Database Cleanup", () => {
  afterAll(async () => {
    await safeDisconnect();
  });

  it("should clean up all test data from previous runs", async () => {
    // Run cleanup
    await cleanupTestData();

    // Verify state
    const state = await verifyDatabaseState();

    expect(state.isClean).toBe(true);
    expect(state.hasDemo).toBe(true); // Demo account should still exist
    
    console.log("\n🧹 Database Cleanup Report:");
    console.log(`   Accounts: ${state.accounts} (demo account preserved)`);
    console.log(`   Decisions: ${state.decisions} (test data removed)`);
    console.log(`   Audit Logs: ${state.auditLogs}`);
    console.log("   ✅ Database is clean\n");
  });

  it("should not delete demo account or its data", async () => {
    await cleanupTestData();

    const demo = await prisma.account.findUnique({
      where: { email: "demo@payguard.dev" },
    });

    expect(demo).toBeDefined();
    expect(demo?.companyName).toBe("Horizon SAS");
  });

  it("should remove decisions with test- prefix", async () => {
    // Create a test decision
    const demo = await prisma.account.findUniqueOrThrow({
      where: { email: "demo@payguard.dev" },
    });

    const testId = "test-cleanup-verification";
    await prisma.decision.create({
      data: {
        id: testId,
        requestId: "test-req-123",
        agentId: "test-agent",
        accountId: demo.id,
        verdict: "BLOCKED",
        status: "BLOCKED",
        score: 0,
        reasonsJson: "[]",
        complianceJson: '{"DORA":"ok","MiCA":"ok","AML_CFT":"ok","AI_ACT":"ok"}',
        amount: "0.01",
        currency: "AVAX",
        rail: "avalanche",
        recipientAddress: "0x0000000000000000000000000000000000000000",
        purpose: "Test cleanup",
        decisionHash: "0000000000000000000000000000000000000000000000000000000000000000",
        explanation: "Test",
      },
    });

    // Verify it exists
    const beforeCount = await prisma.decision.count({
      where: { id: testId },
    });
    expect(beforeCount).toBe(1);

    // Clean up
    await cleanupTestData();

    // Verify it's gone
    const afterCount = await prisma.decision.count({
      where: { id: testId },
    });
    expect(afterCount).toBe(0);
  });
});
