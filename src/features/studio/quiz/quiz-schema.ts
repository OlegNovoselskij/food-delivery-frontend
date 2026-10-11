import { z } from "zod";

import type { QuizManage } from "@/api/types";

const TITLE_MAX_LENGTH = 200;
export const MIN_PASSING_SCORE = 1;
export const MAX_PASSING_SCORE = 100;
const DEFAULT_PASSING_SCORE = 60;
export const MAX_ATTEMPTS_LIMIT = 20;

const wholeNumberIn = (min: number, max: number) => (value: string) =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

export const quizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(TITLE_MAX_LENGTH, `Use at most ${TITLE_MAX_LENGTH} characters`),
  passing_score: z
    .string()
    .trim()
    .refine(
      wholeNumberIn(MIN_PASSING_SCORE, MAX_PASSING_SCORE),
      `Enter a whole percent from ${MIN_PASSING_SCORE} to ${MAX_PASSING_SCORE}`,
    ),
  max_attempts: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || wholeNumberIn(1, MAX_ATTEMPTS_LIMIT)(value),
      `Leave empty for unlimited, or enter 1 to ${MAX_ATTEMPTS_LIMIT}`,
    ),
});

export type QuizFormValues = z.infer<typeof quizSchema>;

export function defaultQuizValues(): QuizFormValues {
  return { title: "Module quiz", passing_score: String(DEFAULT_PASSING_SCORE), max_attempts: "" };
}

export function quizToValues(quiz: QuizManage): QuizFormValues {
  return {
    title: quiz.title,
    passing_score: String(quiz.passing_score),
    max_attempts: quiz.max_attempts === null ? "" : String(quiz.max_attempts),
  };
}

export function toQuizPayload(values: QuizFormValues) {
  return {
    title: values.title,
    passing_score: Number(values.passing_score),
    max_attempts: values.max_attempts === "" ? null : Number(values.max_attempts),
  };
}
