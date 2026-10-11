import { z } from "zod";

import type { QuestionInput, QuestionManage } from "@/api/types";

export const QUESTION_TYPES = [
  { value: "single_choice", label: "Single choice", description: "One option is correct" },
  {
    value: "multiple_choice",
    label: "Multiple choice",
    description: "Several options can be correct",
  },
  {
    value: "open_text",
    label: "Open answer",
    description: "Students write an answer, you grade it",
  },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export const QUESTION_TEXT_MAX_LENGTH = 5000;
export const OPTION_TEXT_MAX_LENGTH = 500;
export const EXPLANATION_MAX_LENGTH = 2000;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
export const MAX_POINTS = 100;
export const DEFAULT_POINTS = 1;

export function isQuestionType(value: string): value is QuestionType {
  return QUESTION_TYPES.some((type) => type.value === value);
}

export function questionTypeLabel(value: string): string {
  return QUESTION_TYPES.find((type) => type.value === value)?.label ?? value;
}

const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string(),
  is_correct: z.boolean(),
});

export const questionSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Enter the question")
      .max(QUESTION_TEXT_MAX_LENGTH, `Use at most ${QUESTION_TEXT_MAX_LENGTH} characters`),
    question_type: z.enum(["single_choice", "multiple_choice", "open_text"]),
    points: z
      .string()
      .trim()
      .refine(
        (value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_POINTS,
        `Enter whole points from 1 to ${MAX_POINTS}`,
      ),
    explanation: z
      .string()
      .max(EXPLANATION_MAX_LENGTH, `Use at most ${EXPLANATION_MAX_LENGTH} characters`),
    options: z.array(optionSchema).max(MAX_OPTIONS, `Use at most ${MAX_OPTIONS} options`),
  })
  .superRefine((values, context) => {
    if (values.question_type === "open_text") return;
    const issue = (message: string, path: (string | number)[] = ["options"]) => {
      context.addIssue({ code: "custom", path, message });
    };
    const textProblems = values.options.flatMap((option, index) => {
      const length = option.text.trim().length;
      if (length === 0) return [{ index, message: "Enter the option text" }];
      if (length > OPTION_TEXT_MAX_LENGTH) {
        return [{ index, message: `Use at most ${OPTION_TEXT_MAX_LENGTH} characters` }];
      }
      return [];
    });
    textProblems.forEach(({ index, message }) => {
      issue(message, ["options", index, "text"]);
    });
    if (textProblems.length > 0) return;
    if (values.options.length < MIN_OPTIONS) {
      issue(`Add at least ${MIN_OPTIONS} options`);
      return;
    }
    const correct = values.options.filter((option) => option.is_correct).length;
    if (values.question_type === "single_choice" && correct !== 1) {
      issue("Mark exactly one option as correct");
      return;
    }
    if (values.question_type === "multiple_choice" && correct < 1) {
      issue("Mark at least one option as correct");
      return;
    }
    const texts = values.options.map((option) => option.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) issue("Each option needs different text");
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;

export function blankOption(): QuestionFormValues["options"][number] {
  return { text: "", is_correct: false };
}

export function emptyQuestion(): QuestionFormValues {
  return {
    text: "",
    question_type: "single_choice",
    points: String(DEFAULT_POINTS),
    explanation: "",
    options: [blankOption(), blankOption()],
  };
}

export function questionToValues(question: QuestionManage): QuestionFormValues {
  return {
    text: question.text,
    question_type: isQuestionType(question.question_type)
      ? question.question_type
      : "single_choice",
    points: String(question.points),
    explanation: question.explanation ?? "",
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
      is_correct: option.is_correct,
    })),
  };
}

export function toQuestionPayload(values: QuestionFormValues): QuestionInput {
  const explanation = values.explanation.trim();
  return {
    text: values.text,
    question_type: values.question_type,
    points: Number(values.points),
    explanation: explanation === "" ? null : explanation,
    options:
      values.question_type === "open_text"
        ? []
        : values.options.map((option) => ({
            ...(option.id === undefined ? {} : { id: option.id }),
            text: option.text,
            is_correct: option.is_correct,
          })),
  };
}

export function keepSingleCorrect(
  options: QuestionFormValues["options"],
  index: number,
): QuestionFormValues["options"] {
  return options.map((option, position) => ({ ...option, is_correct: position === index }));
}
