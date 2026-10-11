import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { AnswerIn } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const quizKeys = {
  all: ["quizzes"] as const,
  attempts: (quizId: number) => ["quizzes", quizId, "attempts"] as const,
  attempt: (attemptId: number) => ["attempts", attemptId] as const,
};

export function myAttemptsQuery(quizId: number) {
  return queryOptions({
    queryKey: quizKeys.attempts(quizId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/quizzes/{quiz_id}/my-attempts", { params: { path: { quiz_id: quizId } } }),
      ),
    staleTime: 0,
  });
}

export function attemptQuery(attemptId: number) {
  return queryOptions({
    queryKey: quizKeys.attempt(attemptId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/attempts/{attempt_id}", { params: { path: { attempt_id: attemptId } } }),
      ),
    staleTime: 0,
  });
}

export function startAttempt(quizId: number) {
  return unwrap(
    api.POST("/api/v1/quizzes/{quiz_id}/attempts", { params: { path: { quiz_id: quizId } } }),
  );
}

export function submitAttempt(attemptId: number, answers: AnswerIn[]) {
  return unwrap(
    api.POST("/api/v1/attempts/{attempt_id}/submit", {
      params: { path: { attempt_id: attemptId } },
      body: { answers },
    }),
  );
}
