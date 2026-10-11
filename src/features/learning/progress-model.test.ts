import { describe, expect, it } from "vitest";

import { buildProgressFor } from "@/test/progress-factory";

import {
  applyLessonToggle,
  firstIncompleteLessonId,
  isLessonCompleted,
  minutesLeft,
  moduleFractions,
  modulesCompleted,
  orderedLessonIds,
  percentOf,
} from "./progress-model";

function sample() {
  return buildProgressFor([
    { id: 1, lessons: [{ id: 10, completed: true }, { id: 11 }], quiz: { id: 100, passed: false } },
    { id: 2, lessons: [{ id: 20 }, { id: 21 }] },
  ]);
}

describe("percentOf", () => {
  it("uses integer division so 100 means everything is done", () => {
    expect(percentOf(2, 3)).toBe(66);
    expect(percentOf(3, 3)).toBe(100);
    expect(percentOf(0, 0)).toBe(0);
  });
});

describe("applyLessonToggle", () => {
  it("completes a lesson and recomputes module, course and next lesson", () => {
    const next = applyLessonToggle(sample(), 11, true);
    expect(isLessonCompleted(next, 11)).toBe(true);
    const [first] = next.modules;
    expect(first?.progress.lessons_completed).toBe(2);
    expect(first?.progress.percent).toBe(66);
    expect(next.progress.lessons_completed).toBe(2);
    expect(next.progress.percent).toBe(40);
    expect(next.progress.minutes_completed).toBe(20);
    expect(next.next_lesson_id).toBe(20);
  });

  it("undoes a completion", () => {
    const done = applyLessonToggle(sample(), 11, true);
    const undone = applyLessonToggle(done, 11, false);
    expect(isLessonCompleted(undone, 11)).toBe(false);
    expect(undone.progress.lessons_completed).toBe(1);
    expect(undone.next_lesson_id).toBe(11);
  });

  it("does not change anything for unknown lessons or repeated actions", () => {
    const progress = sample();
    expect(applyLessonToggle(progress, 999, true)).toBe(progress);
    expect(applyLessonToggle(progress, 10, true)).toBe(progress);
  });

  it("does not mutate the original progress", () => {
    const progress = sample();
    applyLessonToggle(progress, 11, true);
    expect(isLessonCompleted(progress, 11)).toBe(false);
  });

  it("has no next lesson when every lesson is done", () => {
    let progress = sample();
    for (const id of [11, 20, 21]) progress = applyLessonToggle(progress, id, true);
    expect(progress.next_lesson_id).toBeNull();
    expect(firstIncompleteLessonId(progress.modules)).toBeNull();
  });
});

describe("derived values", () => {
  it("lists lessons in order and module fractions", () => {
    const progress = sample();
    expect(orderedLessonIds(progress)).toEqual([10, 11, 20, 21]);
    expect(moduleFractions(progress)).toEqual([0.33, 0]);
  });

  it("counts finished modules and minutes left", () => {
    const progress = applyLessonToggle(applyLessonToggle(sample(), 20, true), 21, true);
    expect(modulesCompleted(progress)).toBe(1);
    expect(minutesLeft(progress.progress)).toBe(10);
  });
});
