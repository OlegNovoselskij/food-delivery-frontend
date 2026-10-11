import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

import type { ApiError } from "@/api/errors";

export const SERVER_ERROR_FIELD = "root.server";

export function applyServerError<TValues extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<TValues>,
  fields: readonly FieldPath<TValues>[],
  fallbackField?: FieldPath<TValues>,
): void {
  const mapped = error.fieldIssues.filter((issue) => fields.some((field) => field === issue.field));

  if (mapped.length === 0) {
    setError(fallbackField ?? SERVER_ERROR_FIELD, { message: error.message });
    return;
  }

  mapped.forEach((issue) => {
    const field = fields.find((candidate) => candidate === issue.field);
    if (field !== undefined) setError(field, { message: issue.message });
  });
}
