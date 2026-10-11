import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

const COURSE_STALE_TIME_MS = 60_000;
const PROGRAM_STALE_TIME_MS = 5 * 60_000;
export const REVIEWS_PAGE_SIZE = 10;

export const courseKeys = {
  all: ["course"] as const,
  detail: (courseId: number) => ["course", courseId, "detail"] as const,
  program: (courseId: number) => ["course", courseId, "program"] as const,
  reviews: (courseId: number, page: number) => ["course", courseId, "reviews", page] as const,
};

export function courseDetailQuery(courseId: number) {
  return queryOptions({
    queryKey: courseKeys.detail(courseId),
    queryFn: () =>
      unwrap(api.GET("/api/v1/courses/{course_id}", { params: { path: { course_id: courseId } } })),
    staleTime: COURSE_STALE_TIME_MS,
  });
}

export function courseProgramQuery(courseId: number) {
  return queryOptions({
    queryKey: courseKeys.program(courseId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/courses/{course_id}/program", {
          params: { path: { course_id: courseId } },
        }),
      ),
    staleTime: PROGRAM_STALE_TIME_MS,
  });
}

export function courseReviewsQuery(courseId: number, page: number) {
  return queryOptions({
    queryKey: courseKeys.reviews(courseId, page),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/courses/{course_id}/reviews", {
          params: {
            path: { course_id: courseId },
            query: { page, size: REVIEWS_PAGE_SIZE },
          },
        }),
      ),
    staleTime: COURSE_STALE_TIME_MS,
  });
}
