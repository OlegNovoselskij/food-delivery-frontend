import { describe, expect, it } from "vitest";

import type { CourseStatRow, CourseStats } from "@/api/types";
import { buildCourse } from "@/test/factories";

import { computeKpis, joinCourseStats } from "./dashboard";

function row(courseId: number, overrides: Partial<CourseStatRow> = {}): CourseStatRow {
  return {
    course_id: courseId,
    title: `Course ${courseId}`,
    status: "published",
    category: "Programming",
    teacher_name: "Olena M",
    students: 10,
    completed: 4,
    completion_rate: 40,
    rating_avg: 4,
    reviews_count: 3,
    revenue: "100.00",
    ...overrides,
  };
}

const stats: CourseStats = {
  items: [row(1), row(2, { rating_avg: 5, students: 20 })],
  totals: { students: 30, completed: 8, revenue: "250.00" },
};

describe("joinCourseStats", () => {
  it("attaches report rows to courses and tolerates missing ones", () => {
    const rows = joinCourseStats(
      [buildCourse({ id: 1 }), buildCourse({ id: 3, status: "draft" })],
      stats,
    );
    expect(rows[0]?.stats?.students).toBe(10);
    expect(rows[1]?.stats).toBeNull();
  });

  it("works before the report has loaded", () => {
    expect(joinCourseStats([buildCourse({ id: 1 })], undefined)[0]?.stats).toBeNull();
  });
});

describe("computeKpis", () => {
  it("summarises the courses", () => {
    const rows = joinCourseStats(
      [buildCourse({ id: 1 }), buildCourse({ id: 2 }), buildCourse({ id: 3, status: "draft" })],
      stats,
    );
    expect(computeKpis(rows, stats)).toEqual({
      courses: 3,
      published: 2,
      students: 30,
      revenue: "250.00",
      rating: 4.5,
    });
  });

  it("has no rating when no course is rated", () => {
    const rows = joinCourseStats([buildCourse({ id: 3 })], undefined);
    expect(computeKpis(rows, undefined).rating).toBeNull();
  });
});
