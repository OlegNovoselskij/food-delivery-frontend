import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { rootKeys } from "@/api/query-keys";
import { unwrap } from "@/api/unwrap";

const COURSE_STALE_TIME_MS = 60_000;
const PROGRAM_STALE_TIME_MS = 5 * 60_000;

export const courseKeys = {
  all: ["course"] as const,
  detail: (courseId: number) => [...rootKeys.course(courseId), "detail"] as const,
  program: (courseId: number) => [...rootKeys.course(courseId), "program"] as const,
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
