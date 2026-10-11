import { describe, expect, it } from "vitest";

import { formatMoney, formatPrice, formatWholeMoney, isFree } from "./money";

describe("isFree", () => {
  it("recognises zero amounts in every backend spelling", () => {
    expect(isFree("0")).toBe(true);
    expect(isFree("0.00")).toBe(true);
    expect(isFree("0.0")).toBe(true);
  });

  it("treats any positive amount as paid", () => {
    expect(isFree("0.01")).toBe(false);
    expect(isFree("89.00")).toBe(false);
  });
});

describe("formatPrice", () => {
  it("shows Free for zero and dollars otherwise", () => {
    expect(formatPrice("0.00")).toBe("Free");
    expect(formatPrice("89.00")).toBe("$89.00");
    expect(formatPrice("1234.5")).toBe("$1,234.50");
  });
});

describe("formatMoney", () => {
  it("formats numbers and numeric strings", () => {
    expect(formatMoney("74")).toBe("$74.00");
    expect(formatMoney(5.5)).toBe("$5.50");
  });

  it("can drop the cents for large totals", () => {
    expect(formatWholeMoney(80590)).toBe("$80,590");
  });
});
