import { describe, expect, it } from "vitest";

import { formatCountdown, initials } from "./format";

describe("formatCountdown", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(600)).toBe("10:00");
  });

  it("never goes below zero", () => {
    expect(formatCountdown(-3)).toBe("0:00");
  });
});

describe("initials", () => {
  it("uses the first letters of name and surname in upper case", () => {
    expect(initials("andrii", "kovalenko")).toBe("AK");
  });

  it("handles missing parts", () => {
    expect(initials("Maria", "")).toBe("M");
  });
});
