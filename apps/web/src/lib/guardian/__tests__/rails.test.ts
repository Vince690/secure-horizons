import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "@payguard/shared";
import { limitsForRail, policyForRail, railForCurrency } from "@/lib/rails";
import { evaluate } from "../evaluate";
import { legitRequest, makeContext } from "./fixtures";

describe("rails", () => {
  it("maps currency to rail", () => {
    expect(railForCurrency("AVAX")).toBe("avalanche");
    expect(railForCurrency("EUR")).toBe("virtual_card");
  });
  it("applies the card mandate (EUR) on the virtual_card rail", () => {
    expect(limitsForRail(DEFAULT_POLICY, "virtual_card")).toEqual(DEFAULT_POLICY.card);
    expect(limitsForRail(DEFAULT_POLICY, "avalanche").max_per_tx).toBe(DEFAULT_POLICY.max_per_tx);
    const policy = policyForRail({ ...DEFAULT_POLICY, trusted_recipients: ["0x1111111111111111111111111111111111111111"] }, "virtual_card");
    const ok = evaluate(makeContext({ policy, balance: "500", request: legitRequest({ amount: "49.90", currency: "EUR", rail: "virtual_card", context: { page_excerpt: "NordSound ANC Pro 49,90 € par carte", conversation: [{ role: "user", content: "Paie le casque NordSound ANC Pro par carte" }] } }) }));
    expect(ok.verdict).toBe("APPROVED");
    const tooMuch = evaluate(makeContext({ policy, balance: "500", request: legitRequest({ amount: "150", currency: "EUR", rail: "virtual_card", context: { conversation: [{ role: "user", content: "Paie 3 casques NordSound ANC Pro par carte" }] } }) }));
    expect(tooMuch.reasons.map((r) => r.code)).toContain("AMOUNT_OVER_TX_LIMIT");
    expect(tooMuch.verdict).not.toBe("APPROVED");
  });
});
