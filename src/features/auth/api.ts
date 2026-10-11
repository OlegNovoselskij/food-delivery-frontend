import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function currentUserQuery(enabled: boolean) {
  return queryOptions({
    queryKey: authKeys.me,
    queryFn: () => unwrap(api.GET("/api/v1/users/me")),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
