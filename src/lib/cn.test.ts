import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("keeps a text color next to a custom font size token", () => {
    expect(cn("text-on-brand", "text-body")).toBe("text-on-brand text-body");
  });

  it("lets the later font size win over the earlier one", () => {
    expect(cn("text-body", "text-small")).toBe("text-small");
  });

  it("lets the later color win over the earlier one", () => {
    expect(cn("text-muted", "text-ink")).toBe("text-ink");
  });

  it("drops falsy values", () => {
    expect(cn("px-2", false, undefined, "py-1")).toBe("px-2 py-1");
  });
});
