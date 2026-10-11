import { z } from "zod";

import type { AnswerReview, AttemptReviewRequest } from "@/api/types";

const COMMENT_MAX_LENGTH = 2000;

export interface GradingFormValues {
  grades: { points: string; comment: string }[];
}

export function answersToGrade(review: readonly AnswerReview[]): AnswerReview[] {
  return review.filter((item) => item.needs_review);
}

export function buildGradingSchema(maxPoints: readonly number[]) {
  return z.object({
    grades: z
      .array(
        z.object({
          points: z.string().trim(),
          comment: z
            .string()
            .max(COMMENT_MAX_LENGTH, `Use at most ${COMMENT_MAX_LENGTH} characters`),
        }),
      )
      .superRefine((grades, context) => {
        grades.forEach((grade, index) => {
          const max = maxPoints[index] ?? 0;
          if (!/^\d+$/.test(grade.points) || Number(grade.points) > max) {
            context.addIssue({
              code: "custom",
              path: [index, "points"],
              message: `Enter whole points from 0 to ${max}`,
            });
          }
        });
      }),
  });
}

export function initialGrades(items: readonly AnswerReview[]): GradingFormValues {
  return { grades: items.map(() => ({ points: "", comment: "" })) };
}

export function toReviewRequest(
  items: readonly AnswerReview[],
  values: GradingFormValues,
): AttemptReviewRequest {
  return {
    grades: items.map((item, index) => {
      const grade = values.grades[index];
      const comment = grade?.comment.trim() ?? "";
      return {
        question_id: item.question_id,
        points: Number(grade?.points ?? 0),
        comment: comment === "" ? null : comment,
      };
    }),
  };
}
