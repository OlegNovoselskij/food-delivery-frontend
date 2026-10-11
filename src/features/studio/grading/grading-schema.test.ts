import { describe, expect, it } from "vitest";

import type { AnswerReview } from "@/api/types";

import {
  answersToGrade,
  buildGradingSchema,
  initialGrades,
  toReviewRequest,
} from "./grading-schema";

function answer(overrides: Partial<AnswerReview> = {}): AnswerReview {
  return {
    question_id: 1,
    question_text: "Explain",
    question_type: "open_text",
    points: 5,
    options: [],
    selected_option_ids: [],
    text_answer: "Because.",
    correct_option_ids: [],
    is_correct: null,
    points_awarded: null,
    needs_review: true,
    explanation: null,
    teacher_comment: null,
    ...overrides,
  };
}

describe("answersToGrade", () => {
  it("keeps only the answers that need a teacher", () => {
    const items = [answer({ question_id: 1 }), answer({ question_id: 2, needs_review: false })];
    expect(answersToGrade(items).map((item) => item.question_id)).toEqual([1]);
  });
});

describe("buildGradingSchema", () => {
  const schema = buildGradingSchema([5, 2]);

  it("accepts whole points within each question's maximum", () => {
    const result = schema.safeParse({
      grades: [
        { points: "5", comment: "" },
        { points: "0", comment: "Needs work" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("explains the allowed range for each answer", () => {
    const result = schema.safeParse({
      grades: [
        { points: "6", comment: "" },
        { points: "", comment: "" },
      ],
    });
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([
      "Enter whole points from 0 to 5",
      "Enter whole points from 0 to 2",
    ]);
  });

  it("rejects decimals and negatives", () => {
    const result = schema.safeParse({
      grades: [
        { points: "2.5", comment: "" },
        { points: "-1", comment: "" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("toReviewRequest", () => {
  it("pairs each grade with its question and drops blank comments", () => {
    const items = [answer({ question_id: 7 }), answer({ question_id: 9 })];
    const values = {
      grades: [
        { points: "4", comment: "  Good  " },
        { points: "0", comment: "   " },
      ],
    };
    expect(toReviewRequest(items, values)).toEqual({
      grades: [
        { question_id: 7, points: 4, comment: "Good" },
        { question_id: 9, points: 0, comment: null },
      ],
    });
  });

  it("starts with empty grades for every answer", () => {
    expect(initialGrades([answer(), answer()]).grades).toHaveLength(2);
  });
});
