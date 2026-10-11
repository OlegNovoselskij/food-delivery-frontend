import { describe, expect, it } from "vitest";

import {
  emptyQuestion,
  keepSingleCorrect,
  questionSchema,
  questionToValues,
  toQuestionPayload,
  type QuestionFormValues,
} from "./question-schema";

function choice(overrides: Partial<QuestionFormValues> = {}): QuestionFormValues {
  return {
    text: "Which keyword declares a constant?",
    question_type: "single_choice",
    points: "2",
    explanation: "",
    options: [
      { text: "const", is_correct: true },
      { text: "var", is_correct: false },
    ],
    ...overrides,
  };
}

function messagesOf(values: QuestionFormValues): string[] {
  const result = questionSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("questionSchema", () => {
  it("accepts a valid single choice question", () => {
    expect(messagesOf(choice())).toEqual([]);
  });

  it("asks for the question text and whole points", () => {
    expect(messagesOf(choice({ text: "  ", points: "0" }))).toEqual([
      "Enter the question",
      "Enter whole points from 1 to 100",
    ]);
  });

  it("needs at least two options", () => {
    expect(messagesOf(choice({ options: [{ text: "const", is_correct: true }] }))).toEqual([
      "Add at least 2 options",
    ]);
  });

  it("needs exactly one correct option for single choice", () => {
    const none = choice({
      options: [
        { text: "a", is_correct: false },
        { text: "b", is_correct: false },
      ],
    });
    const two = choice({
      options: [
        { text: "a", is_correct: true },
        { text: "b", is_correct: true },
      ],
    });
    expect(messagesOf(none)).toEqual(["Mark exactly one option as correct"]);
    expect(messagesOf(two)).toEqual(["Mark exactly one option as correct"]);
  });

  it("needs at least one correct option for multiple choice", () => {
    const values = choice({
      question_type: "multiple_choice",
      options: [
        { text: "a", is_correct: false },
        { text: "b", is_correct: false },
      ],
    });
    expect(messagesOf(values)).toEqual(["Mark at least one option as correct"]);
    expect(
      messagesOf({
        ...values,
        options: [
          { text: "a", is_correct: true },
          { text: "b", is_correct: true },
        ],
      }),
    ).toEqual([]);
  });

  it("rejects duplicate option texts regardless of case", () => {
    const values = choice({
      options: [
        { text: "Const", is_correct: true },
        { text: " const ", is_correct: false },
      ],
    });
    expect(messagesOf(values)).toEqual(["Each option needs different text"]);
  });

  it("does not check options for open questions", () => {
    expect(messagesOf(choice({ question_type: "open_text", options: [] }))).toEqual([]);
  });
});

describe("question payloads", () => {
  it("keeps option ids so the API can match existing options", () => {
    const payload = toQuestionPayload(
      choice({
        explanation: "  Because.  ",
        options: [
          { id: 4, text: "const", is_correct: true },
          { text: "var", is_correct: false },
        ],
      }),
    );
    expect(payload).toEqual({
      text: "Which keyword declares a constant?",
      question_type: "single_choice",
      points: 2,
      explanation: "Because.",
      options: [
        { id: 4, text: "const", is_correct: true },
        { text: "var", is_correct: false },
      ],
    });
  });

  it("sends no options and a null explanation for open questions", () => {
    const payload = toQuestionPayload(choice({ question_type: "open_text" }));
    expect(payload.options).toEqual([]);
    expect(payload.explanation).toBeNull();
  });

  it("turns a stored question into form values and back", () => {
    const values = questionToValues({
      id: 9,
      text: "Pick",
      question_type: "multiple_choice",
      points: 3,
      position: 1,
      explanation: null,
      options: [
        { id: 1, text: "a", is_correct: true },
        { id: 2, text: "b", is_correct: true },
      ],
    });
    expect(values.points).toBe("3");
    expect(values.explanation).toBe("");
    expect(toQuestionPayload(values).options).toEqual([
      { id: 1, text: "a", is_correct: true },
      { id: 2, text: "b", is_correct: true },
    ]);
  });

  it("starts a new question as single choice with two empty options", () => {
    const blank = emptyQuestion();
    expect(blank.question_type).toBe("single_choice");
    expect(blank.options).toHaveLength(2);
  });
});

describe("keepSingleCorrect", () => {
  it("marks only the chosen option", () => {
    const options = [
      { text: "a", is_correct: true },
      { text: "b", is_correct: true },
      { text: "c", is_correct: false },
    ];
    expect(keepSingleCorrect(options, 2).map((option) => option.is_correct)).toEqual([
      false,
      false,
      true,
    ]);
  });
});
