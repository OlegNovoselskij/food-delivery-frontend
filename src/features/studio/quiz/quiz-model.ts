import type { QuizManage } from "@/api/types";

export function withQuestionsOrder(quiz: QuizManage, orderedIds: readonly number[]): QuizManage {
  const byId = new Map(quiz.questions.map((question) => [question.id, question]));
  const questions = orderedIds.flatMap((id, index) => {
    const question = byId.get(id);
    return question ? [{ ...question, position: index + 1 }] : [];
  });
  return questions.length === quiz.questions.length ? { ...quiz, questions } : quiz;
}

export function questionsSummary(quiz: Pick<QuizManage, "questions" | "total_points">): string {
  const count = quiz.questions.length;
  const noun = count === 1 ? "question" : "questions";
  const points = quiz.total_points === 1 ? "point" : "points";
  return `${count} ${noun} · ${quiz.total_points} ${points}`;
}
