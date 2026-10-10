import { describe, expect, it } from "vitest";
import { computeDecisionHash, toBytes32 } from "../hash";

const base = {
  decision_id: "dec_01",
  request_id: "11111111-1111-4111-8111-111111111111",
  agent_id: "claude-desktop",
  amount: "0.05",
  currency: "AVAX" as const,
  recipient: { address: "0x1111111111111111111111111111111111111111" },
  purpose: "Casque NordSound ANC Pro",
  verdict: "APPROVED" as const,
  score: 100,
  reasons: [{ code: "RECIPIENT_TRUSTED" as const }],
  created_at: "2026-10-11T02:00:00.000Z",
};

describe("computeDecisionHash", () => {
  it("is stable, 64 hex chars, and independent of reason order and address case", () => {
    const a = computeDecisionHash(base);
    const b = computeDecisionHash({
      ...base,
      recipient: { address: base.recipient.address.toUpperCase().replace("0X", "0x") },
      reasons: [...base.reasons].reverse(),
    });
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(toBytes32(a)).toBe(`0x${a}`);
  });
  it("changes when any field changes", () => {
    expect(computeDecisionHash({ ...base, amount: "0.06" })).not.toBe(computeDecisionHash(base));
    expect(computeDecisionHash({ ...base, verdict: "BLOCKED" })).not.toBe(computeDecisionHash(base));
  });
});
