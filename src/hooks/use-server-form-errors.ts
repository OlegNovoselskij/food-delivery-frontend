import { useCallback } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

import { toApiError } from "@/api/errors";
import { applyServerError } from "@/lib/form-errors";

import { useCooldown } from "./use-cooldown";

const HTTP_TOO_MANY_REQUESTS = 429;
const DEFAULT_RETRY_SECONDS = 30;

interface ServerFormErrorOptions<TValues extends FieldValues> {
  setError: UseFormSetError<TValues>;
  fields: readonly FieldPath<TValues>[];
  fallbackField?: FieldPath<TValues>;
}

export function useServerFormErrors<TValues extends FieldValues>({
  setError,
  fields,
  fallbackField,
}: ServerFormErrorOptions<TValues>) {
  const cooldown = useCooldown();
  const { start } = cooldown;

  const handleError = useCallback(
    (error: unknown) => {
      const apiError = toApiError(error);
      if (apiError.status === HTTP_TOO_MANY_REQUESTS) {
        start(apiError.retryAfter ?? DEFAULT_RETRY_SECONDS);
        return;
      }
      applyServerError(apiError, setError, fields, fallbackField);
    },
    [start, setError, fields, fallbackField],
  );

  return { handleError, cooldown };
}
