import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { Enrollment, PayRequest } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { useAuth } from "@/features/auth";
import { notify } from "@/lib/notify";

import {
  cancelEnrollment,
  courseEnrollmentQuery,
  enrollInCourse,
  enrollmentKeys,
  payEnrollment,
} from "./api";
import { ENROLLMENT_STATUS } from "./status";

function syncEnrollment(queryClient: QueryClient, enrollment: Enrollment): void {
  queryClient.setQueryData(enrollmentKeys.forCourse(enrollment.course.id), enrollment);
  void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
}

export function useCourseEnrollment(courseId: number) {
  const { session } = useAuth();
  return useQuery(courseEnrollmentQuery(courseId, session.status === "authenticated"));
}

export function useEnrollMutation(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: (enrollment) => {
      syncEnrollment(queryClient, enrollment);
      notify.success(
        enrollment.status === ENROLLMENT_STATUS.pendingPayment
          ? "Enrolled. Complete the payment to start learning."
          : "You are enrolled. Happy learning.",
      );
    },
    onError: notify.error,
  });
}

export function usePayMutation(enrollmentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PayRequest) => payEnrollment(enrollmentId, body),
    onSuccess: (enrollment) => {
      syncEnrollment(queryClient, enrollment);
      notify.success("Payment received. You can start learning.");
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: (enrollment: Enrollment) => cancelEnrollment(enrollment.id),
    onSuccess: (enrollment) => {
      syncEnrollment(queryClient, enrollment);
      notify.success("Enrollment cancelled.");
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const cancel = useCallback(
    async (enrollment: Enrollment): Promise<void> => {
      const refunded = enrollment.payment?.status === "succeeded";
      const confirmed = await confirm({
        title: "Cancel enrollment?",
        description: refunded
          ? `You will lose access to ${enrollment.course.title}. Your payment will be refunded.`
          : `You will lose access to ${enrollment.course.title}. You can enroll again later.`,
        confirmLabel: "Cancel enrollment",
        cancelLabel: "Keep enrollment",
        tone: "danger",
      });
      if (confirmed) mutate(enrollment);
    },
    [confirm, mutate],
  );

  return { cancel, isPending: mutation.isPending };
}
