import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/features/auth";
import { notify } from "@/lib/notify";

import { updateProfile } from "./api";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      notify.success("Profile saved.");
    },
  });
}
