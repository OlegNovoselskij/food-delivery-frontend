import { describe, expect, it } from "vitest";

import type { QuestionPublic } from "@/api/types";

import {
  buildSubmission,
  countAnswered,
  isAnswered,
  toggleOption,
  unansweredCount,
  withText,
} from "./answers";

function question(
  id: number,
  type: QuestionPublic["question_type"],
  optionIds: number[] = [],
): QuestionPublic {
  return {
    id,
    text: `Question ${id}`,
    question_type: type,
    points: 1,
    position: id,
    options: optionIds.map((optionId) => ({ id: optionId, text: `Option ${optionId}` })),
  };
}

const single = question(1, "single_choice", [10, 11]);
const multiple = question(2, "multiple_choice", [20, 21, 22]);
const open = question(3, "open_text");

describe("toggleOption", () => {
  it("replaces the selection for single choice", () => {
    const first = toggleOption(single, undefined, 10);
    expect(first.optionIds).toEqual([10]);
    expect(toggleOption(single, first, 11).optionIds).toEqual([11]);
  });

  it("adds and removes options for multiple choice", () => {
    const first = toggleOption(multiple, undefined, 20);
    const second = toggleOption(multiple, first, 22);
    expect(second.optionIds).toEqual([20, 22]);
    expect(toggleOption(multiple, second, 20).optionIds).toEqual([22]);
  });
});

describe("isAnswered and counts", () => {
  it("needs options for choice questions and text for open ones", () => {
    expect(isAnswered(single, undefined)).toBe(false);
    expect(isAnswered(single, { optionIds: [10], text: "" })).toBe(true);
    expect(isAnswered(open, { optionIds: [], text: "   " })).toBe(false);
    expect(isAnswered(open, withText(undefined, "My answer"))).toBe(true);
  });

  it("counts answered and unanswered questions", () => {
    const answers = { 1: { optionIds: [10], text: "" } };
    expect(countAnswered([single, multiple, open], answers)).toBe(1);
    expect(unansweredCount([single, multiple, open], answers)).toBe(2);
  });
});

describe("buildSubmission", () => {
  it("sends only answered questions in the shape the API expects", () => {
    const answers = {
      1: { optionIds: [11], text: "" },
      2: { optionIds: [], text: "" },
      3: { optionIds: [], text: "  Because types.  " },
    };
    expect(buildSubmission([single, multiple, open], answers)).toEqual([
      { question_id: 1, option_ids: [11] },
      { question_id: 3, option_ids: [], text: "Because types." },
    ]);
  });

  it("sends nothing when nothing is answered", () => {
    expect(buildSubmission([single], {})).toEqual([]);
  });
});
