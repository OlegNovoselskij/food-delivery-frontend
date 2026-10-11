import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

const RECOMMENDATIONS_STALE_TIME_MS = 5 * 60_000;

export const RECOMMENDATIONS_LIMIT = 3;

export const recommendationKeys = {
  all: ["recommendations"] as const,
  list: (limit: number) => ["recommendations", limit] as const,
};

export function recommendationsQuery(limit: number) {
  return queryOptions({
    queryKey: recommendationKeys.list(limit),
    queryFn: () => unwrap(api.GET("/api/v1/recommendations", { params: { query: { limit } } })),
    staleTime: RECOMMENDATIONS_STALE_TIME_MS,
  });
}
