import { QueryClient } from "@tanstack/react-query";

import { ApiError, NETWORK_ERROR_STATUS } from "@/api/errors";

const MAX_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 30_000;

function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!(error instanceof ApiError)) return true;
  return error.status === NETWORK_ERROR_STATUS || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}
