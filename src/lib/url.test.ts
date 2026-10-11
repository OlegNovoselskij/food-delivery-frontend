import { describe, expect, it } from "vitest";

import { isHttpUrl } from "./url";

describe("isHttpUrl", () => {
  it("accepts http and https links", () => {
    expect(isHttpUrl("https://cdn.example.com/cover.png")).toBe(true);
    expect(isHttpUrl("http://localhost:9000/cover.png")).toBe(true);
  });

  it("rejects other schemes, relative paths and empty values", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,x")).toBe(false);
    expect(isHttpUrl("/cover.png")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });
});
