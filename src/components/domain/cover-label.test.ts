import { describe, expect, it } from "vitest";

import { coverLabel } from "./cover-label";

describe("coverLabel", () => {
  it("uses the first word of the title", () => {
    expect(coverLabel("TypeScript from zero to production")).toBe("TypeScript");
  });

  it("keeps a short first word together with the second", () => {
    expect(coverLabel("UX research fundamentals")).toBe("UX research");
  });

  it("is safe for empty and very long titles", () => {
    expect(coverLabel("")).toBe("");
    expect(coverLabel("Supercalifragilisticexpialidocious course")).toHaveLength(16);
  });
});
