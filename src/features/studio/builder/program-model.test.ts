import { describe, expect, it } from "vitest";

import { buildLesson, buildModule, buildProgram } from "@/test/factories";

import {
  findLesson,
  lessonStatus,
  moveId,
  withLessonsOrder,
  withModule,
  withModuleTitle,
  withModulesOrder,
  withoutLesson,
  withoutModule,
} from "./program-model";

const program = buildProgram({
  modules: [
    buildModule({
      id: 1,
      title: "One",
      lessons: [buildLesson({ id: 10, title: "A" }), buildLesson({ id: 11, title: "B" })],
    }),
    buildModule({ id: 2, title: "Two", lessons: [buildLesson({ id: 20, title: "C" })] }),
  ],
});

describe("moveId", () => {
  it("moves an id to the position of another", () => {
    expect(moveId([1, 2, 3], 1, 3)).toEqual([2, 3, 1]);
    expect(moveId([1, 2, 3], 3, 1)).toEqual([3, 1, 2]);
  });

  it("keeps the order for unknown ids or the same id", () => {
    expect(moveId([1, 2], 1, 1)).toEqual([1, 2]);
    expect(moveId([1, 2], 1, 9)).toEqual([1, 2]);
  });
});

describe("withModulesOrder", () => {
  it("reorders modules and renumbers their positions", () => {
    const next = withModulesOrder(program, [2, 1]);
    expect(next.modules.map((module) => [module.id, module.position])).toEqual([
      [2, 1],
      [1, 2],
    ]);
  });

  it("ignores an order that does not match the modules", () => {
    expect(withModulesOrder(program, [2])).toBe(program);
  });
});

describe("withLessonsOrder", () => {
  it("reorders lessons inside one module only", () => {
    const next = withLessonsOrder(program, 1, [11, 10]);
    expect(next.modules[0]?.lessons.map((lesson) => lesson.id)).toEqual([11, 10]);
    expect(next.modules[1]).toBe(program.modules[1]);
  });

  it("ignores an order that does not match the lessons", () => {
    expect(withLessonsOrder(program, 1, [11]).modules[0]).toBe(program.modules[0]);
  });
});

describe("edits", () => {
  it("replaces, renames and removes modules", () => {
    const updated = buildModule({ id: 2, title: "Renamed", lessons: [] });
    expect(withModule(program, updated).modules[1]?.title).toBe("Renamed");
    expect(withModuleTitle(program, 1, "Fresh").modules[0]?.title).toBe("Fresh");
    expect(withoutModule(program, 1).modules.map((module) => module.id)).toEqual([2]);
  });

  it("removes a lesson from whichever module holds it", () => {
    const next = withoutLesson(program, 10);
    expect(next.modules[0]?.lessons.map((lesson) => lesson.id)).toEqual([11]);
  });
});

describe("findLesson and lessonStatus", () => {
  it("finds a lesson across modules", () => {
    expect(findLesson(program, 20)?.title).toBe("C");
    expect(findLesson(program, 99)).toBeNull();
  });

  it("describes video readiness", () => {
    expect(lessonStatus(buildLesson({ lesson_type: "video", has_video: true }))).toBe(
      "video-ready",
    );
    expect(lessonStatus(buildLesson({ lesson_type: "video", has_video: false }))).toBe("no-video");
    expect(lessonStatus(buildLesson({ lesson_type: "article", has_video: false }))).toBe("article");
  });
});
