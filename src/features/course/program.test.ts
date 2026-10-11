import { describe, expect, it } from "vitest";

import { buildLesson, buildModule, buildProgram } from "@/test/factories";

import { firstPreviewLesson, formatTotalDuration, lessonPath, quizCount } from "./program";

describe("firstPreviewLesson", () => {
  it("finds the first preview lesson across modules", () => {
    const program = buildProgram({
      modules: [
        buildModule({ id: 1, lessons: [buildLesson({ id: 10, is_preview: false })] }),
        buildModule({ id: 2, lessons: [buildLesson({ id: 20, is_preview: true })] }),
      ],
    });
    expect(firstPreviewLesson(program)?.id).toBe(20);
  });

  it("returns null when nothing is free to preview", () => {
    const program = buildProgram({
      modules: [buildModule({ lessons: [buildLesson({ is_preview: false })] })],
    });
    expect(firstPreviewLesson(program)).toBeNull();
  });
});

describe("quizCount", () => {
  it("counts modules that have a quiz", () => {
    const program = buildProgram({
      modules: [
        buildModule({ has_quiz: true }),
        buildModule({ id: 2 }),
        buildModule({ id: 3, has_quiz: true }),
      ],
    });
    expect(quizCount(program)).toBe(2);
  });
});

describe("formatTotalDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatTotalDuration(0)).toBe("");
    expect(formatTotalDuration(45)).toBe("45 min");
    expect(formatTotalDuration(120)).toBe("2 h");
    expect(formatTotalDuration(135)).toBe("2 h 15 min");
  });
});

describe("lessonPath", () => {
  it("builds the player URL", () => {
    expect(lessonPath(3, 9)).toBe("/learning/courses/3/lessons/9");
  });
});
