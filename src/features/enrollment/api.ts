import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { PayRequest } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  mine: ["enrollments", "mine"] as const,
  forCourse: (courseId: number) => ["enrollments", "course", courseId] as const,
};

export function myEnrollmentsQuery() {
  return queryOptions({
    queryKey: enrollmentKeys.mine,
    queryFn: () => unwrap(api.GET("/api/v1/enrollments/mine", { params: { query: {} } })),
    staleTime: 0,
  });
}

export function courseEnrollmentQuery(courseId: number, enabled: boolean) {
  return queryOptions({
    queryKey: enrollmentKeys.forCourse(courseId),
    queryFn: async () => {
      const enrollments = await unwrap(
        api.GET("/api/v1/enrollments/mine", { params: { query: { course_id: courseId } } }),
      );
      return enrollments[0] ?? null;
    },
    enabled,
    staleTime: 0,
  });
}

export function enrollInCourse(courseId: number) {
  return unwrap(
    api.POST("/api/v1/courses/{course_id}/enroll", { params: { path: { course_id: courseId } } }),
  );
}

export function payEnrollment(enrollmentId: number, body: PayRequest) {
  return unwrap(
    api.POST("/api/v1/enrollments/{enrollment_id}/pay", {
      params: { path: { enrollment_id: enrollmentId } },
      body,
    }),
  );
}

export function cancelEnrollment(enrollmentId: number) {
  return unwrap(
    api.POST("/api/v1/enrollments/{enrollment_id}/cancel", {
      params: { path: { enrollment_id: enrollmentId } },
    }),
  );
}
