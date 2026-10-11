import { describe, expect, it } from "vitest";

import { safeNextPath, signInPathFor } from "./safe-redirect";

describe("safeNextPath", () => {
  it("accepts internal paths with query strings", () => {
    expect(safeNextPath("/learning?tab=history")).toBe("/learning?tab=history");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("returns null when nothing is given", () => {
    expect(safeNextPath(null)).toBeNull();
  });
});

describe("signInPathFor", () => {
  it("encodes the destination", () => {
    expect(signInPathFor("/courses?page=2")).toBe("/sign-in?next=%2Fcourses%3Fpage%3D2");
  });
});
