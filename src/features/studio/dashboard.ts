import type { Course, CourseStatRow, CourseStats } from "@/api/types";

export interface StudioCourseRow {
  course: Course;
  stats: CourseStatRow | null;
}

export function joinCourseStats(
  courses: readonly Course[],
  stats: CourseStats | undefined,
): StudioCourseRow[] {
  const byId = new Map((stats?.items ?? []).map((row) => [row.course_id, row]));
  return courses.map((course) => ({ course, stats: byId.get(course.id) ?? null }));
}

export interface StudioKpis {
  courses: number;
  published: number;
  students: number;
  revenue: string;
  rating: number | null;
}

export function computeKpis(
  rows: readonly StudioCourseRow[],
  stats: CourseStats | undefined,
): StudioKpis {
  const rated = rows.flatMap((row) =>
    row.stats?.rating_avg == null ? [] : [row.stats.rating_avg],
  );
  return {
    courses: rows.length,
    published: rows.filter((row) => row.course.status === "published").length,
    students: stats?.totals.students ?? 0,
    revenue: stats?.totals.revenue ?? "0",
    rating: rated.length === 0 ? null : rated.reduce((sum, value) => sum + value, 0) / rated.length,
  };
}
