import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { QuestionInput, QuizCreate, QuizUpdate } from "@/api/types";
import { unwrap, unwrapEmpty } from "@/api/unwrap";

export const quizManageKeys = {
  detail: (quizId: number) => ["studio", "quiz", quizId] as const,
};

export function quizManageQuery(quizId: number) {
  return queryOptions({
    queryKey: quizManageKeys.detail(quizId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/quizzes/{quiz_id}/manage", { params: { path: { quiz_id: quizId } } }),
      ),
    staleTime: 0,
  });
}

export function createQuiz(moduleId: number, body: QuizCreate) {
  return unwrap(
    api.POST("/api/v1/modules/{module_id}/quiz", {
      params: { path: { module_id: moduleId } },
      body,
    }),
  );
}

export function updateQuiz(quizId: number, body: QuizUpdate) {
  return unwrap(
    api.PATCH("/api/v1/quizzes/{quiz_id}", { params: { path: { quiz_id: quizId } }, body }),
  );
}

export function deleteQuiz(quizId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/quizzes/{quiz_id}", { params: { path: { quiz_id: quizId } } }),
  );
}

export function addQuestion(quizId: number, body: QuestionInput) {
  return unwrap(
    api.POST("/api/v1/quizzes/{quiz_id}/questions", {
      params: { path: { quiz_id: quizId } },
      body,
    }),
  );
}

export function updateQuestion(questionId: number, body: QuestionInput) {
  return unwrap(
    api.PUT("/api/v1/questions/{question_id}", {
      params: { path: { question_id: questionId } },
      body,
    }),
  );
}

export function deleteQuestion(questionId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/questions/{question_id}", {
      params: { path: { question_id: questionId } },
    }),
  );
}

export function reorderQuestions(quizId: number, ids: number[]) {
  return unwrap(
    api.PUT("/api/v1/quizzes/{quiz_id}/questions/order", {
      params: { path: { quiz_id: quizId } },
      body: { ids },
    }),
  );
}
