import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AttemptReviewRequest } from "@/api/types";
import { quizKeys } from "@/features/quiz";
import { notify } from "@/lib/notify";

import { gradingKeys, submitAttemptReview } from "./api";

export function useSubmitReview(attemptId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AttemptReviewRequest) => submitAttemptReview(attemptId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quizKeys.attempt(attemptId) });
      void queryClient.invalidateQueries({ queryKey: gradingKeys.pending });
      notify.success("Grades saved. The student has been notified.");
    },
  });
}
