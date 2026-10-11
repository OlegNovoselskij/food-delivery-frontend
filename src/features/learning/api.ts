import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

const LESSON_STALE_TIME_MS = 60_000;
const SIGNED_URL_REFRESH_RATIO = 0.8;
const MS_PER_SECOND = 1000;

export const learningKeys = {
  history: ["enrollments", "history"] as const,
  progress: (enrollmentId: number) => ["enrollments", enrollmentId, "progress"] as const,
  lesson: (lessonId: number) => ["lessons", lessonId] as const,
  videoUrl: (lessonId: number) => ["lessons", lessonId, "video-url"] as const,
};

export function historyQuery() {
  return queryOptions({
    queryKey: learningKeys.history,
    queryFn: () => unwrap(api.GET("/api/v1/learning/history", { params: { query: {} } })),
    staleTime: 0,
  });
}

export function progressQuery(enrollmentId: number, enabled = true) {
  return queryOptions({
    queryKey: learningKeys.progress(enrollmentId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/enrollments/{enrollment_id}/progress", {
          params: { path: { enrollment_id: enrollmentId } },
        }),
      ),
    enabled,
    staleTime: 0,
  });
}

export function lessonQuery(lessonId: number) {
  return queryOptions({
    queryKey: learningKeys.lesson(lessonId),
    queryFn: () =>
      unwrap(api.GET("/api/v1/lessons/{lesson_id}", { params: { path: { lesson_id: lessonId } } })),
    staleTime: LESSON_STALE_TIME_MS,
    retry: false,
  });
}

export function videoUrlQuery(lessonId: number, enabled: boolean) {
  return queryOptions({
    queryKey: learningKeys.videoUrl(lessonId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/lessons/{lesson_id}/video-url", {
          params: { path: { lesson_id: lessonId } },
        }),
      ),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (query) => {
      const expiresIn = query.state.data?.expires_in;
      return expiresIn === undefined ? false : expiresIn * MS_PER_SECOND * SIGNED_URL_REFRESH_RATIO;
    },
  });
}

export function markLessonComplete(enrollmentId: number, lessonId: number) {
  return unwrap(
    api.POST("/api/v1/enrollments/{enrollment_id}/lessons/{lesson_id}/complete", {
      params: { path: { enrollment_id: enrollmentId, lesson_id: lessonId } },
    }),
  );
}

export function markLessonIncomplete(enrollmentId: number, lessonId: number) {
  return unwrap(
    api.DELETE("/api/v1/enrollments/{enrollment_id}/lessons/{lesson_id}/complete", {
      params: { path: { enrollment_id: enrollmentId, lesson_id: lessonId } },
    }),
  );
}

export function fetchMaterialUrl(materialId: number) {
  return unwrap(
    api.GET("/api/v1/materials/{material_id}/download-url", {
      params: { path: { material_id: materialId } },
    }),
  );
}
