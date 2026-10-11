import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { saveDownload } from "@/api/download";
import { unwrap } from "@/api/unwrap";

import type { StudentFilters } from "./student-filters";

export const STUDENTS_PAGE_SIZE = 10;
const HARDEST_QUESTIONS_LIMIT = 10;
export const MIN_ANSWERS_FOR_DIFFICULTY = 3;

const analyticsKeys = {
  all: ["studio", "analytics"] as const,
  funnel: (courseId: number) => ["studio", "analytics", courseId, "funnel"] as const,
  quizzes: (courseId: number) => ["studio", "analytics", courseId, "quizzes"] as const,
  questions: (courseId: number) => ["studio", "analytics", courseId, "questions"] as const,
  students: (courseId: number, filters: StudentFilters) =>
    ["studio", "analytics", courseId, "students", filters] as const,
};

export type ReportKind = "funnel" | "quizzes" | "questions" | "students";

export function funnelQuery(courseId: number) {
  return queryOptions({
    queryKey: analyticsKeys.funnel(courseId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/teacher/courses/{course_id}/funnel", {
          params: { path: { course_id: courseId } },
        }),
      ),
    staleTime: 0,
  });
}

export function quizStatsQuery(courseId: number) {
  return queryOptions({
    queryKey: analyticsKeys.quizzes(courseId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/teacher/courses/{course_id}/quizzes", {
          params: { path: { course_id: courseId } },
        }),
      ),
    staleTime: 0,
  });
}

export function questionStatsQuery(courseId: number) {
  return queryOptions({
    queryKey: analyticsKeys.questions(courseId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/teacher/courses/{course_id}/questions", {
          params: {
            path: { course_id: courseId },
            query: { limit: HARDEST_QUESTIONS_LIMIT, min_answers: MIN_ANSWERS_FOR_DIFFICULTY },
          },
        }),
      ),
    staleTime: 0,
  });
}

function studentsQueryParams(filters: StudentFilters) {
  return {
    page: filters.page,
    size: STUDENTS_PAGE_SIZE,
    ...(filters.status === null ? {} : { status: filters.status }),
    ...(filters.inactiveDays === null ? {} : { inactive_days: filters.inactiveDays }),
  };
}

export function studentsQuery(courseId: number, filters: StudentFilters) {
  return queryOptions({
    queryKey: analyticsKeys.students(courseId, filters),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/reports/teacher/courses/{course_id}/students", {
          params: { path: { course_id: courseId }, query: studentsQueryParams(filters) },
        }),
      ),
    staleTime: 0,
    placeholderData: (previous) => previous,
  });
}

export async function exportReportCsv(
  kind: ReportKind,
  courseId: number,
  filters: StudentFilters,
): Promise<void> {
  const path = { course_id: courseId };
  const fallback = `course-${courseId}-${kind}.csv`;
  switch (kind) {
    case "funnel":
      await saveDownload(
        await api.GET("/api/v1/reports/teacher/courses/{course_id}/funnel", {
          params: { path, query: { format: "csv" } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "quizzes":
      await saveDownload(
        await api.GET("/api/v1/reports/teacher/courses/{course_id}/quizzes", {
          params: { path, query: { format: "csv" } },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "questions":
      await saveDownload(
        await api.GET("/api/v1/reports/teacher/courses/{course_id}/questions", {
          params: {
            path,
            query: {
              format: "csv",
              limit: HARDEST_QUESTIONS_LIMIT,
              min_answers: MIN_ANSWERS_FOR_DIFFICULTY,
            },
          },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
    case "students":
      await saveDownload(
        await api.GET("/api/v1/reports/teacher/courses/{course_id}/students", {
          params: {
            path,
            query: {
              format: "csv",
              ...(filters.status === null ? {} : { status: filters.status }),
              ...(filters.inactiveDays === null ? {} : { inactive_days: filters.inactiveDays }),
            },
          },
          parseAs: "blob",
        }),
        fallback,
      );
      return;
  }
}
