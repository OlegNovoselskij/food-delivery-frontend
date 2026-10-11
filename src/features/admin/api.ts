import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { saveDownload } from "@/api/download";
import { unwrap, unwrapEmpty } from "@/api/unwrap";

import type { Period } from "./range";

export const TOP_TEACHERS_LIMIT = 5;
export const COURSE_PREVIEW_LIMIT = 5;
export const BREAKDOWN_LIMIT = 8;
export const FULL_TABLE_LIMIT = 100;

export const BREAKDOWN_DIMENSIONS = ["course", "teacher", "category"] as const;
export const COURSE_SORTS = ["students", "completed", "revenue", "rating"] as const;
export const TEACHER_SORTS = ["rating", "students", "revenue", "courses"] as const;

export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number];
export type CourseSort = (typeof COURSE_SORTS)[number];
export type TeacherSort = (typeof TEACHER_SORTS)[number];

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  revenue: (period: Period) => ["admin", "revenue", period] as const,
  breakdown: (period: Period, by: BreakdownDimension) =>
    ["admin", "breakdown", period, by] as const,
  growth: (period: Period) => ["admin", "growth", period] as const,
  teachers: (period: Period, sort: TeacherSort, limit: number) =>
    ["admin", "teachers", period, sort, limit] as const,
  courses: (period: Period, sort: CourseSort, categoryId: number | null, limit: number) =>
    ["admin", "courses", period, sort, categoryId, limit] as const,
};

function dates(period: Period) {
  return { date_from: period.date_from, date_to: period.date_to };
}

export function overviewQuery() {
  return queryOptions({
    queryKey: adminKeys.overview,
    queryFn: () => unwrap(api.GET("/api/v1/reports/admin/overview")),
    staleTime: 0,
  });
}

export function revenueQuery(period: Period) {
  return queryOptions({
    queryKey: adminKeys.revenue(period),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/admin/revenue", {
          params: { query: { ...dates(period), group_by: period.group_by } },
        }),
      ),
    staleTime: 0,
  });
}

export function breakdownQuery(period: Period, by: BreakdownDimension) {
  return queryOptions({
    queryKey: adminKeys.breakdown(period, by),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/admin/revenue/breakdown", {
          params: { query: { ...dates(period), by, limit: BREAKDOWN_LIMIT } },
        }),
      ),
    staleTime: 0,
  });
}

export function growthQuery(period: Period) {
  return queryOptions({
    queryKey: adminKeys.growth(period),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/admin/users/growth", {
          params: { query: { ...dates(period), group_by: period.group_by } },
        }),
      ),
    staleTime: 0,
  });
}

export function teachersQuery(period: Period, sort: TeacherSort, limit: number) {
  return queryOptions({
    queryKey: adminKeys.teachers(period, sort, limit),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/admin/teachers", {
          params: { query: { ...dates(period), sort, limit } },
        }),
      ),
    staleTime: 0,
  });
}

export function adminCoursesQuery(
  period: Period,
  sort: CourseSort,
  categoryId: number | null,
  limit: number,
) {
  return queryOptions({
    queryKey: adminKeys.courses(period, sort, categoryId, limit),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/admin/courses", {
          params: {
            query: {
              ...dates(period),
              sort,
              limit,
              ...(categoryId === null ? {} : { category_id: categoryId }),
            },
          },
        }),
      ),
    staleTime: 0,
  });
}

export const ADMIN_REPORTS = [
  { value: "revenue", label: "Revenue over time" },
  { value: "breakdown", label: "Revenue breakdown" },
  { value: "growth", label: "User growth" },
  { value: "teachers", label: "Teacher ranking" },
  { value: "courses", label: "Course performance" },
] as const;

export type AdminReport = (typeof ADMIN_REPORTS)[number]["value"];

export interface ExportOptions {
  breakdownBy: BreakdownDimension;
  courseSort: CourseSort;
  teacherSort: TeacherSort;
  categoryId: number | null;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  breakdownBy: "course",
  courseSort: "students",
  teacherSort: "rating",
  categoryId: null,
};

export async function exportAdminCsv(
  report: AdminReport,
  period: Period,
  options: ExportOptions,
): Promise<void> {
  const fallback = `atrium-${report}.csv`;
  const base = { format: "csv", ...dates(period) } as const;
  switch (report) {
    case "revenue":
      await saveDownload(
        await api.GET("/api/v1/reports/admin/revenue", {
          params: { query: { ...base, group_by: period.group_by } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "breakdown":
      await saveDownload(
        await api.GET("/api/v1/reports/admin/revenue/breakdown", {
          params: { query: { ...base, by: options.breakdownBy, limit: FULL_TABLE_LIMIT } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "growth":
      await saveDownload(
        await api.GET("/api/v1/reports/admin/users/growth", {
          params: { query: { ...base, group_by: period.group_by } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "teachers":
      await saveDownload(
        await api.GET("/api/v1/reports/admin/teachers", {
          params: { query: { ...base, sort: options.teacherSort, limit: FULL_TABLE_LIMIT } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "courses":
      await saveDownload(
        await api.GET("/api/v1/reports/admin/courses", {
          params: {
            query: {
              ...base,
              sort: options.courseSort,
              limit: FULL_TABLE_LIMIT,
              ...(options.categoryId === null ? {} : { category_id: options.categoryId }),
            },
          },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
  }
}

export function createCategory(name: string) {
  return unwrap(api.POST("/api/v1/categories", { body: { name } }));
}

export function renameCategory(categoryId: number, name: string) {
  return unwrap(
    api.PATCH("/api/v1/categories/{category_id}", {
      params: { path: { category_id: categoryId } },
      body: { name },
    }),
  );
}

export function deleteCategory(categoryId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/categories/{category_id}", {
      params: { path: { category_id: categoryId } },
    }),
  );
}
