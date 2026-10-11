import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { notify } from "@/lib/notify";

import { courseEnrollmentQuery, enrollInCourse, enrollmentKeys } from "./api";

export function useCourseEnrollment(courseId: number) {
  const { session } = useAuth();
  return useQuery(courseEnrollmentQuery(courseId, session.status === "authenticated"));
}

export function useEnrollMutation(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: (enrollment) => {
      queryClient.setQueryData(enrollmentKeys.forCourse(courseId), enrollment);
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine });
      notify.success("You are enrolled.");
    },
    onError: notify.error,
  });
}
