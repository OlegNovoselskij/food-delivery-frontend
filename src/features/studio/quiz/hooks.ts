import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import type {
  QuestionInput,
  QuestionManage,
  QuizCreate,
  QuizManage,
  QuizUpdate,
} from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { courseKeys } from "@/features/course";
import { notify } from "@/lib/notify";

import { useCourseChangeRefresh } from "../hooks";
import {
  addQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  quizManageKeys,
  reorderQuestions,
  updateQuestion,
  updateQuiz,
} from "./api";
import { withQuestionsOrder } from "./quiz-model";

function quizPath(courseId: number, quizId: number): string {
  return `/studio/courses/${courseId}/quizzes/${quizId}`;
}

function useQuizCache(courseId: number, quizId: number) {
  const queryClient = useQueryClient();
  const key = quizManageKeys.detail(quizId);
  const refreshCourse = useCourseChangeRefresh(courseId);

  const read = useCallback(() => queryClient.getQueryData<QuizManage>(key), [queryClient, key]);
  const write = useCallback(
    (update: (quiz: QuizManage) => QuizManage) => {
      queryClient.setQueryData<QuizManage>(key, (quiz) => (quiz ? update(quiz) : quiz));
    },
    [queryClient, key],
  );
  const cancel = useCallback(
    () => queryClient.cancelQueries({ queryKey: key }),
    [queryClient, key],
  );
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: courseKeys.program(courseId) });
    refreshCourse();
  }, [queryClient, key, courseId, refreshCourse]);

  return { read, write, cancel, refresh };
}

export function useCreateQuiz(courseId: number, moduleId: number) {
  const refresh = useCourseChangeRefresh(courseId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: QuizCreate) => createQuiz(moduleId, body),
    onSuccess: (quiz) => {
      queryClient.setQueryData(quizManageKeys.detail(quiz.id), quiz);
      void queryClient.invalidateQueries({ queryKey: courseKeys.program(courseId) });
      refresh();
      notify.success("Quiz created. Add its questions next.");
      void navigate(quizPath(courseId, quiz.id));
    },
  });
}

export function useUpdateQuiz(courseId: number, quizId: number) {
  const { write, refresh } = useQuizCache(courseId, quizId);
  return useMutation({
    mutationFn: (body: QuizUpdate) => updateQuiz(quizId, body),
    onSuccess: (quiz) => {
      write(() => quiz);
      refresh();
      notify.success("Quiz settings saved.");
    },
  });
}

export function useDeleteQuiz(courseId: number, quiz: Pick<QuizManage, "id" | "title">) {
  const { refresh } = useQuizCache(courseId, quiz.id);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => deleteQuiz(quiz.id),
    onSuccess: () => {
      refresh();
      notify.success("Quiz deleted.");
      void navigate(`/studio/courses/${courseId}`);
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(async (): Promise<void> => {
    const confirmed = await confirm({
      title: "Delete this quiz?",
      description: `${quiz.title} and all of its questions will be deleted. This cannot be undone.`,
      confirmLabel: "Delete quiz",
      cancelLabel: "Keep quiz",
      tone: "danger",
    });
    if (confirmed) mutate();
  }, [confirm, mutate, quiz.title]);

  return { remove, isPending: mutation.isPending };
}

export function useAddQuestion(courseId: number, quizId: number) {
  const { refresh } = useQuizCache(courseId, quizId);
  return useMutation({
    mutationFn: (body: QuestionInput) => addQuestion(quizId, body),
    onSuccess: () => {
      refresh();
      notify.success("Question added.");
    },
  });
}

export function useUpdateQuestion(courseId: number, quizId: number, questionId: number) {
  const { refresh } = useQuizCache(courseId, quizId);
  return useMutation({
    mutationFn: (body: QuestionInput) => updateQuestion(questionId, body),
    onSuccess: () => {
      refresh();
      notify.success("Question saved.");
    },
  });
}

export function useDeleteQuestion(courseId: number, quizId: number) {
  const { refresh } = useQuizCache(courseId, quizId);
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: (question: QuestionManage) => deleteQuestion(question.id),
    onSuccess: () => {
      refresh();
      notify.success("Question deleted.");
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(
    async (question: QuestionManage): Promise<void> => {
      const confirmed = await confirm({
        title: "Delete this question?",
        description: "The question and its options will be deleted. This cannot be undone.",
        confirmLabel: "Delete question",
        cancelLabel: "Keep question",
        tone: "danger",
      });
      if (confirmed) mutate(question);
    },
    [confirm, mutate],
  );

  return { remove, isPending: mutation.isPending };
}

export function useReorderQuestions(courseId: number, quizId: number) {
  const { read, write, cancel, refresh } = useQuizCache(courseId, quizId);
  return useMutation({
    mutationFn: (ids: number[]) => reorderQuestions(quizId, ids),
    onMutate: async (ids) => {
      await cancel();
      const previous = read();
      write((quiz) => withQuestionsOrder(quiz, ids));
      return { previous };
    },
    onError: (error, _ids, context) => {
      const previous = context?.previous;
      if (previous) write(() => previous);
      notify.error(error);
    },
    onSuccess: (quiz) => {
      write(() => quiz);
    },
    onSettled: refresh,
  });
}
