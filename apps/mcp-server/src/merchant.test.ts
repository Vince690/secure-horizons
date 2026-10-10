import { describe, expect, it } from "vitest";
import { pricesIn } from "./merchant.js";

describe("pricesIn", () => {
  it("reads crypto, euro and dollar prices", () => {
    expect(pricesIn("0.05 AVAX TTC")).toEqual([{ amount: "0.05", currency: "AVAX" }]);
    expect(pricesIn("Prix : 12,99 € livraison incluse")).toEqual([{ amount: "12.99", currency: "EUR" }]);
    expect(pricesIn("€19.90 or $21.50")).toEqual([{ amount: "19.90", currency: "EUR" }, { amount: "21.50", currency: "USD" }]);
  });
});
