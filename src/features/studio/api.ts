import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { CourseCreate, CourseUpdate } from "@/api/types";
import { unwrap, unwrapEmpty } from "@/api/unwrap";

export const studioKeys = {
  all: ["studio"] as const,
  courses: ["studio", "courses"] as const,
  dashboard: ["studio", "dashboard"] as const,
};

export function myCoursesQuery() {
  return queryOptions({
    queryKey: studioKeys.courses,
    queryFn: () => unwrap(api.GET("/api/v1/courses/mine")),
    staleTime: 0,
  });
}

export function teacherDashboardQuery() {
  return queryOptions({
    queryKey: studioKeys.dashboard,
    queryFn: () => unwrap(api.GET("/api/v1/reports/teacher/dashboard", { params: { query: {} } })),
    staleTime: 0,
  });
}

export function createCourse(body: CourseCreate) {
  return unwrap(api.POST("/api/v1/courses", { body }));
}

export function updateCourse(courseId: number, body: CourseUpdate) {
  return unwrap(
    api.PATCH("/api/v1/courses/{course_id}", { params: { path: { course_id: courseId } }, body }),
  );
}

export function publishCourse(courseId: number) {
  return unwrap(
    api.POST("/api/v1/courses/{course_id}/publish", { params: { path: { course_id: courseId } } }),
  );
}

export function archiveCourse(courseId: number) {
  return unwrap(
    api.POST("/api/v1/courses/{course_id}/archive", { params: { path: { course_id: courseId } } }),
  );
}

export function deleteCourse(courseId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/courses/{course_id}", { params: { path: { course_id: courseId } } }),
  );
}
