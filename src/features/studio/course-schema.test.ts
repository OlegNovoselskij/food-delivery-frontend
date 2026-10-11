import { describe, expect, it } from "vitest";

import { courseSchema, isCourseLevel, toCoursePayload } from "./course-schema";

const valid = {
  title: "TypeScript from zero",
  description: "A practical course.",
  category_id: 1,
  level: "beginner",
  price: "49.90",
  cover_url: "",
} as const;

describe("courseSchema", () => {
  it("accepts a complete course", () => {
    expect(courseSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a title of at least three characters", () => {
    expect(courseSchema.safeParse({ ...valid, title: "ab" }).success).toBe(false);
  });

  it("accepts whole and decimal prices and rejects other formats", () => {
    for (const price of ["0", "49", "49.9", "49.90"]) {
      expect(courseSchema.safeParse({ ...valid, price }).success).toBe(true);
    }
    for (const price of ["", "-5", "4,5", "49.999", "abc"]) {
      expect(courseSchema.safeParse({ ...valid, price }).success).toBe(false);
    }
  });

  it("only accepts web links for the cover", () => {
    expect(
      courseSchema.safeParse({ ...valid, cover_url: "https://cdn.example.com/a.png" }).success,
    ).toBe(true);
    expect(courseSchema.safeParse({ ...valid, cover_url: "javascript:alert(1)" }).success).toBe(
      false,
    );
  });

  it("requires a category", () => {
    expect(courseSchema.safeParse({ ...valid, category_id: 0 }).success).toBe(false);
  });
});

describe("toCoursePayload", () => {
  it("turns empty optional fields into null", () => {
    expect(toCoursePayload({ ...valid, description: "", cover_url: "" })).toMatchObject({
      description: null,
      cover_url: null,
      price: "49.90",
    });
  });
});

describe("isCourseLevel", () => {
  it("recognises backend levels only", () => {
    expect(isCourseLevel("advanced")).toBe(true);
    expect(isCourseLevel("expert")).toBe(false);
  });
});
