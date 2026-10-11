import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { rootKeys } from "@/api/query-keys";
import type { Review } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { notify } from "@/lib/notify";

import { createReview, deleteReview, reviewKeys, updateReview } from "./api";

function useRefreshAfterChange(courseId: number) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: reviewKeys.courseRoot(courseId) });
    void queryClient.invalidateQueries({ queryKey: rootKeys.course(courseId) });
    void queryClient.invalidateQueries({ queryKey: rootKeys.catalog });
  }, [queryClient, courseId]);
}

interface ReviewValues {
  rating: number;
  comment: string | null;
}

export function useCreateReview(courseId: number) {
  const refresh = useRefreshAfterChange(courseId);
  return useMutation({
    mutationFn: (values: ReviewValues) => createReview(courseId, values),
    onSuccess: () => {
      refresh();
      notify.success("Review published. Thank you.");
    },
  });
}

export function useUpdateReview(courseId: number, reviewId: number) {
  const refresh = useRefreshAfterChange(courseId);
  return useMutation({
    mutationFn: (values: ReviewValues) => updateReview(reviewId, values),
    onSuccess: () => {
      refresh();
      notify.success("Review updated.");
    },
  });
}

export function useDeleteReview(courseId: number) {
  const refresh = useRefreshAfterChange(courseId);
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: (review: Review) => deleteReview(review.id),
    onSuccess: () => {
      refresh();
      notify.success("Review deleted.");
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(
    async (review: Review): Promise<void> => {
      const confirmed = await confirm({
        title: "Delete your review?",
        description: "Your rating and comment will be removed from the course page.",
        confirmLabel: "Delete review",
        cancelLabel: "Keep review",
        tone: "danger",
      });
      if (confirmed) mutate(review);
    },
    [confirm, mutate],
  );

  return { remove, isPending: mutation.isPending };
}
