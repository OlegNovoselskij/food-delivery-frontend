import type { AttemptSummary } from "@/api/types";

export const ATTEMPT_STATUS = {
  inProgress: "in_progress",
  pendingReview: "pending_review",
  graded: "graded",
} as const;

export type QuizStatus = "passed" | "awaiting-review" | "in-progress" | "ready";

export function quizStatus(attempts: readonly AttemptSummary[]): QuizStatus {
  if (attempts.some((attempt) => attempt.passed === true)) return "passed";
  if (attempts.some((attempt) => attempt.status === ATTEMPT_STATUS.pendingReview)) {
    return "awaiting-review";
  }
  if (attempts.some((attempt) => attempt.status === ATTEMPT_STATUS.inProgress)) {
    return "in-progress";
  }
  return "ready";
}

export function bestScore(attempts: readonly AttemptSummary[]): number | null {
  const scores = attempts.flatMap((attempt) => (attempt.score === null ? [] : [attempt.score]));
  return scores.length === 0 ? null : Math.max(...scores);
}

export function attemptLabel(attempt: AttemptSummary): string {
  switch (attempt.status) {
    case ATTEMPT_STATUS.inProgress:
      return "In progress";
    case ATTEMPT_STATUS.pendingReview:
      return "Waiting for review";
    default:
      return attempt.passed === true ? "Passed" : "Not passed";
  }
}
