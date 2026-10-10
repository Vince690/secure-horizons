import { describe, expect, it } from "vitest";
import { evaluate } from "../evaluate";
import { semanticInjection } from "../rules/semanticInjection";
import { makeContext } from "./fixtures";

describe("semanticInjection", () => {
  it("adds a non-terminal penalty when the model is confident", () => {
    const ctx = makeContext({ semanticScreen: { manipulation: true, confidence: 0.9, summary: "La page ordonne à l'agent de payer ailleurs." } });
    const reason = semanticInjection(ctx);
    expect(reason?.code).toBe("SEMANTIC_MANIPULATION_SUSPECTED");
    expect(reason?.message).toContain("90 %");
    // trusted merchant 100 - 40 = 60 => HOLD, not BLOCKED: the model never decides alone
    expect(evaluate(ctx).verdict).toBe("HOLD");
  });
  it("stays silent below the confidence threshold or without a screen", () => {
    expect(semanticInjection(makeContext({ semanticScreen: { manipulation: true, confidence: 0.4, summary: "" } }))).toBeNull();
    expect(semanticInjection(makeContext({ semanticScreen: { manipulation: false, confidence: 0.99, summary: "" } }))).toBeNull();
    expect(semanticInjection(makeContext())).toBeNull();
  });
});
