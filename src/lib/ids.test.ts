import { describe, expect, it } from "vitest";

import { parseId } from "./ids";

describe("parseId", () => {
  it("accepts positive integers", () => {
    expect(parseId("12")).toBe(12);
  });

  it("rejects everything else", () => {
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId("1.5")).toBeNull();
    expect(parseId("abc")).toBeNull();
    expect(parseId(undefined)).toBeNull();
  });
});
