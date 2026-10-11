import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { AttemptReviewRequest } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const gradingKeys = {
  pending: ["studio", "grading", "pending"] as const,
};

export function pendingReviewsQuery() {
  return queryOptions({
    queryKey: gradingKeys.pending,
    queryFn: () => unwrap(api.GET("/api/v1/reviews/pending")),
    staleTime: 0,
  });
}

export function submitAttemptReview(attemptId: number, body: AttemptReviewRequest) {
  return unwrap(
    api.POST("/api/v1/attempts/{attempt_id}/review", {
      params: { path: { attempt_id: attemptId } },
      body,
    }),
  );
}
