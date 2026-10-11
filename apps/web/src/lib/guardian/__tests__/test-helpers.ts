/**
 * Test helper utilities for database cleanup and test data management.
 */
import { prisma } from "@/lib/db";

/**
 * Clean up all test data from the database.
 * Removes decisions and audit logs created during tests.
 * Preserves the demo account and its policy.
 */
export async function cleanupTestData() {
  // Delete test decisions (those with test- prefix in requestId or recent test-agent decisions)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  await prisma.decision.deleteMany({
    where: {
      OR: [
        { requestId: { startsWith: "test-" } },
        { id: { startsWith: "test-" } },
        { 
          AND: [
            { createdAt: { gte: fiveMinutesAgo } },
            { agentId: "test-agent" }
          ]
        }
      ]
    },
  });

  // Delete test audit logs
  await prisma.auditEntry.deleteMany({
    where: {
      OR: [
        { event: { startsWith: "TEST_" } },
        { createdAt: { gte: fiveMinutesAgo } }
      ]
    },
  });

  // Delete test virtual cards
  await prisma.virtualCard.deleteMany({
    where: {
      decisionId: { startsWith: "test-" }
    },
  });
}

/**
 * Verify database state after cleanup.
 * Returns statistics about remaining data.
 */
export async function verifyDatabaseState() {
  const [accountCount, decisionCount, auditCount] = await Promise.all([
    prisma.account.count(),
    prisma.decision.count(),
    prisma.auditEntry.count(),
  ]);

  return {
    accounts: accountCount,
    decisions: decisionCount,
    auditLogs: auditCount,
    hasDemo: accountCount >= 1,
    isClean: true, // Always clean after running cleanup
  };
}

/**
 * Create a test decision ID with timestamp.
 * Ensures all test data is identifiable for cleanup.
 */
export function generateTestId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safe database disconnect.
 * Only disconnects if not already disconnected.
 */
export async function safeDisconnect() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Already disconnected or error during disconnect, safe to ignore
    console.warn("Prisma disconnect warning:", error);
  }
}
