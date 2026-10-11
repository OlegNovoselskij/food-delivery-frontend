import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import type { AnswerIn, Attempt } from "@/api/types";
import { enrollmentKeys } from "@/features/enrollment";
import { notify } from "@/lib/notify";
import { attemptPath } from "@/lib/paths";

import { quizKeys, startAttempt, submitAttempt } from "./api";
import { clearDraft } from "./draft";

export function useStartAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startAttempt(quizId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quizId) });
    },
    onError: notify.error,
  });
}

interface SubmitVariables {
  attempt: Attempt;
  answers: AnswerIn[];
}

export function useSubmitAttempt(courseId: number | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ attempt, answers }: SubmitVariables) => submitAttempt(attempt.id, answers),
    onSuccess: (result, { attempt }) => {
      clearDraft(attempt.id);
      queryClient.setQueryData(quizKeys.attempt(result.id), result);
      void queryClient.invalidateQueries({ queryKey: quizKeys.attempts(result.quiz_id) });
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      void navigate(attemptPath(result.id, courseId), { replace: true });
    },
    onError: notify.error,
  });
}
