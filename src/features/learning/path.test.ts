import { describe, expect, it } from "vitest";

import { buildLesson, buildModule, buildProgram } from "@/test/factories";
import { buildProgressFor } from "@/test/progress-factory";

import { buildPath, moduleOfLesson, neighbours } from "./path";

const program = buildProgram({
  modules: [
    buildModule({
      id: 1,
      course_id: 5,
      has_quiz: true,
      lessons: [
        buildLesson({ id: 10, title: "Intro", is_preview: true, duration_minutes: 6 }),
        buildLesson({ id: 11, title: "Basics", duration_minutes: 12 }),
      ],
    }),
    buildModule({
      id: 2,
      course_id: 5,
      lessons: [buildLesson({ id: 20, title: "Advanced", duration_minutes: null })],
    }),
  ],
});

describe("buildPath for a learner", () => {
  const progress = buildProgressFor([
    { id: 1, lessons: [{ id: 10, completed: true }, { id: 11 }], quiz: { id: 100, passed: false } },
    { id: 2, lessons: [{ id: 20 }] },
  ]);

  it("marks done, current and upcoming lessons and links them", () => {
    const [first, second] = buildPath({ program, progress, currentLessonId: 11, fullAccess: true });
    expect(first?.nodes.map((node) => node.state)).toEqual(["done", "current", "upcoming"]);
    expect(first?.nodes[1]).toMatchObject({
      title: "Basics",
      meta: "12 min",
      href: "/learning/courses/5/lessons/11",
    });
    expect(second?.nodes[0]).toMatchObject({ state: "upcoming", meta: "" });
  });

  it("adds the module quiz with its state and link", () => {
    const [first] = buildPath({ program, progress, currentLessonId: 11, fullAccess: true });
    expect(first?.nodes[2]).toMatchObject({
      kind: "quiz",
      id: 100,
      state: "upcoming",
      href: "/learning/quizzes/100",
    });
  });

  it("summarises each module", () => {
    const [first, second] = buildPath({ program, progress, currentLessonId: 11, fullAccess: true });
    expect(first).toMatchObject({ status: "in-progress", summary: "1 of 3", number: 1 });
    expect(second).toMatchObject({ status: "idle", summary: "0 of 1" });
  });

  it("reports a module as done when every node is done", () => {
    const finished = buildProgressFor([
      {
        id: 1,
        lessons: [
          { id: 10, completed: true },
          { id: 11, completed: true },
        ],
        quiz: { id: 100, passed: true },
      },
      { id: 2, lessons: [{ id: 20 }] },
    ]);
    const [first] = buildPath({
      program,
      progress: finished,
      currentLessonId: 20,
      fullAccess: true,
    });
    expect(first?.status).toBe("done");
  });
});

describe("buildPath for a visitor", () => {
  it("locks everything except preview lessons", () => {
    const [first, second] = buildPath({
      program,
      progress: null,
      currentLessonId: 10,
      fullAccess: false,
    });
    expect(first?.nodes.map((node) => node.state)).toEqual(["current", "locked", "locked"]);
    expect(first?.nodes[1]?.href).toBeNull();
    expect(second?.status).toBe("locked");
  });
});

describe("neighbours and moduleOfLesson", () => {
  it("finds the previous and next lessons across modules", () => {
    expect(neighbours(program, 11)).toMatchObject({ previous: { id: 10 }, next: { id: 20 } });
    expect(neighbours(program, 10).previous).toBeNull();
    expect(neighbours(program, 20).next).toBeNull();
    expect(neighbours(program, 999)).toEqual({ previous: null, next: null });
  });

  it("finds the module and its number", () => {
    expect(moduleOfLesson(program, 20)).toMatchObject({ number: 2, module: { id: 2 } });
    expect(moduleOfLesson(program, 999)).toBeNull();
  });
});
