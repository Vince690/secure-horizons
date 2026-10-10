import { describe, expect, it } from "vitest";
import { createMockChainClient } from "./mock";

const HASH = `0x${"ab".repeat(32)}` as `0x${string}`;
const TO = "0x1111111111111111111111111111111111111111" as const;

describe("createMockChainClient", () => {
  it("moves funds, returns explorer links, and honours the kill switch", async () => {
    const chain = createMockChainClient({ balance: "1" });
    const tx = await chain.executePayment("dec_1", TO, "0.25", HASH);
    expect(tx.tx_hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(tx.explorer_url).toContain(tx.tx_hash);
    expect(await chain.getBalance()).toBe("0.75");

    await chain.setKillSwitch(true, "test");
    expect(await chain.isPaused()).toBe(true);
    await expect(chain.executePayment("dec_2", TO, "0.1", HASH)).rejects.toThrow(/paused/);
    // Recording a decision must still work while paused (proof of refusal).
    const rec = await chain.recordDecision("dec_2", 2, HASH);
    expect(rec.tx_hash).toMatch(/^0x/);
  });
});
