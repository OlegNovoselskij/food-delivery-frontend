import { describe, expect, it } from "vitest";

import type { HistoryItem } from "@/api/types";
import { buildCourseListItem, buildEnrollment } from "@/test/factories";
import { buildProgressFor, buildSummary } from "@/test/progress-factory";

import {
  computeStats,
  groupHistory,
  moduleProgressLabel,
  recentActivity,
  resumeTarget,
} from "./dashboard";

function item(
  id: number,
  status: string,
  lastActivity: string | null,
  lessonsDone = 0,
  minutesDone = 0,
): HistoryItem {
  return {
    enrollment: buildEnrollment({
      id,
      status,
      course: buildCourseListItem({ id, title: `Course ${id}` }),
    }),
    progress: buildSummary({ lessons_completed: lessonsDone, minutes_completed: minutesDone }),
    last_activity_at: lastActivity,
  };
}

const activeItem = item(1, "active", "2026-03-01T10:00:00Z", 3, 30);

const items = [
  activeItem,
  item(2, "active", "2026-03-05T10:00:00Z", 1, 10),
  item(3, "pending_payment", null),
  item(4, "completed", "2026-02-01T10:00:00Z", 8, 80),
  item(5, "cancelled", "2026-01-01T10:00:00Z", 2, 20),
];

describe("groupHistory", () => {
  it("groups by status and orders active courses by recent activity", () => {
    const groups = groupHistory(items);
    expect(groups.active.map((entry) => entry.enrollment.id)).toEqual([2, 1]);
    expect(groups.pending).toHaveLength(1);
    expect(groups.completed).toHaveLength(1);
    expect(groups.cancelled).toHaveLength(1);
  });
});

describe("computeStats", () => {
  it("ignores cancelled enrollments", () => {
    expect(computeStats(items)).toEqual({
      lessonsCompleted: 12,
      coursesCompleted: 1,
      minutesLearned: 120,
    });
  });
});

describe("recentActivity", () => {
  it("returns the latest active entries first and skips never-started ones", () => {
    expect(recentActivity(items, 3).map((entry) => entry.enrollment.id)).toEqual([2, 1, 4]);
  });
});

describe("resumeTarget", () => {
  const progress = buildProgressFor([
    { id: 1, lessons: [{ id: 10, completed: true }, { id: 11 }] },
    { id: 2, lessons: [{ id: 20, title: "Joins" }] },
  ]);

  it("points at the next lesson with module position and time left", () => {
    const target = resumeTarget(activeItem, progress);
    expect(target).toMatchObject({
      lessonId: 11,
      moduleNumber: 1,
      moduleCount: 2,
      minutesLeft: 20,
    });
  });

  it("returns null when everything is done or progress is missing", () => {
    expect(resumeTarget(activeItem, undefined)).toBeNull();
    const finished = buildProgressFor([{ id: 1, lessons: [{ id: 10, completed: true }] }]);
    expect(resumeTarget(activeItem, finished)).toBeNull();
  });
});

describe("moduleProgressLabel", () => {
  it("counts finished modules", () => {
    const progress = buildProgressFor([
      { id: 1, lessons: [{ id: 10, completed: true }] },
      { id: 2, lessons: [{ id: 20 }] },
    ]);
    expect(moduleProgressLabel(progress)).toBe("1 of 2 modules");
  });
});
