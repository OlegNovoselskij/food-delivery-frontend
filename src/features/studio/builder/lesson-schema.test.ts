import { describe, expect, it } from "vitest";

import { isLessonType, lessonSchema, toLessonPayload } from "./lesson-schema";

const valid = {
  title: "Generics without fear",
  content: "Refactor a helper into a constrained generic.",
  lesson_type: "video",
  duration: "21",
  is_preview: false,
} as const;

describe("lessonSchema", () => {
  it("accepts a complete lesson", () => {
    expect(lessonSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a title", () => {
    expect(lessonSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });

  it("accepts empty and whole minute durations up to 1000", () => {
    expect(lessonSchema.safeParse({ ...valid, duration: "" }).success).toBe(true);
    expect(lessonSchema.safeParse({ ...valid, duration: "1000" }).success).toBe(true);
    expect(lessonSchema.safeParse({ ...valid, duration: "1001" }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...valid, duration: "1.5" }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...valid, duration: "-3" }).success).toBe(false);
  });
});

describe("toLessonPayload", () => {
  it("turns blanks into null and the duration into a number", () => {
    expect(toLessonPayload({ ...valid, content: "  ", duration: "" })).toMatchObject({
      content: null,
      duration_minutes: null,
    });
    expect(toLessonPayload(valid).duration_minutes).toBe(21);
  });
});

describe("isLessonType", () => {
  it("accepts the two backend types only", () => {
    expect(isLessonType("video")).toBe(true);
    expect(isLessonType("article")).toBe(true);
    expect(isLessonType("quiz")).toBe(false);
  });
});
