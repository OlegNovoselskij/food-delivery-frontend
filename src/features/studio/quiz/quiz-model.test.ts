import { describe, expect, it } from "vitest";

import type { QuizManage } from "@/api/types";

import { questionsSummary, withQuestionsOrder } from "./quiz-model";

function quiz(): QuizManage {
  const question = (id: number, position: number) => ({
    id,
    text: `Question ${id}`,
    question_type: "open_text",
    points: 1,
    position,
    explanation: null,
    options: [],
  });
  return {
    id: 1,
    module_id: 2,
    title: "Quiz",
    passing_score: 60,
    max_attempts: null,
    has_attempts: false,
    total_points: 3,
    questions: [question(10, 1), question(11, 2), question(12, 3)],
  };
}

describe("withQuestionsOrder", () => {
  it("reorders questions and renumbers positions", () => {
    const next = withQuestionsOrder(quiz(), [12, 10, 11]);
    expect(next.questions.map((question) => [question.id, question.position])).toEqual([
      [12, 1],
      [10, 2],
      [11, 3],
    ]);
  });

  it("ignores an order that does not cover every question", () => {
    const original = quiz();
    expect(withQuestionsOrder(original, [10, 11])).toBe(original);
  });
});

describe("questionsSummary", () => {
  it("counts questions and points with plurals", () => {
    expect(questionsSummary(quiz())).toBe("3 questions · 3 points");
    expect(questionsSummary({ questions: [], total_points: 1 })).toBe("0 questions · 1 point");
  });
});
