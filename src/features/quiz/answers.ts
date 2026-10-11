import type { AnswerIn, QuestionPublic } from "@/api/types";

export const QUESTION_TYPES = {
  single: "single_choice",
  multiple: "multiple_choice",
  text: "open_text",
} as const;

export type QuestionKind = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export interface DraftAnswer {
  optionIds: number[];
  text: string;
}

export type DraftAnswers = Record<number, DraftAnswer>;

export const EMPTY_ANSWER: DraftAnswer = { optionIds: [], text: "" };

const KINDS: readonly string[] = Object.values(QUESTION_TYPES);

export function isQuestionKind(value: string): value is QuestionKind {
  return KINDS.includes(value);
}

export function isAnswered(question: QuestionPublic, answer: DraftAnswer | undefined): boolean {
  if (answer === undefined) return false;
  return question.question_type === QUESTION_TYPES.text
    ? answer.text.trim() !== ""
    : answer.optionIds.length > 0;
}

export function countAnswered(questions: readonly QuestionPublic[], answers: DraftAnswers): number {
  return questions.filter((question) => isAnswered(question, answers[question.id])).length;
}

export function toggleOption(
  question: QuestionPublic,
  current: DraftAnswer | undefined,
  optionId: number,
): DraftAnswer {
  const base = current ?? EMPTY_ANSWER;
  if (question.question_type === QUESTION_TYPES.single) {
    return { ...base, optionIds: [optionId] };
  }
  const selected = base.optionIds.includes(optionId);
  return {
    ...base,
    optionIds: selected
      ? base.optionIds.filter((id) => id !== optionId)
      : [...base.optionIds, optionId],
  };
}

export function withText(current: DraftAnswer | undefined, text: string): DraftAnswer {
  return { ...(current ?? EMPTY_ANSWER), text };
}

export function buildSubmission(
  questions: readonly QuestionPublic[],
  answers: DraftAnswers,
): AnswerIn[] {
  return questions.flatMap((question) => {
    const answer = answers[question.id];
    if (!isAnswered(question, answer) || answer === undefined) return [];
    if (question.question_type === QUESTION_TYPES.text) {
      return [{ question_id: question.id, option_ids: [], text: answer.text.trim() }];
    }
    return [{ question_id: question.id, option_ids: answer.optionIds }];
  });
}

export function unansweredCount(
  questions: readonly QuestionPublic[],
  answers: DraftAnswers,
): number {
  return questions.length - countAnswered(questions, answers);
}
