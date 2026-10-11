import { z } from "zod";

export const STUDENT_STATUSES = ["active", "completed"] as const;
export const INACTIVE_DAY_OPTIONS = [7, 14, 30] as const;

export interface StudentFilters {
  page: number;
  status: (typeof STUDENT_STATUSES)[number] | null;
  inactiveDays: (typeof INACTIVE_DAY_OPTIONS)[number] | null;
}

export const NO_STUDENT_FILTERS: StudentFilters = { page: 1, status: null, inactiveDays: null };

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(NO_STUDENT_FILTERS.page),
  status: z.enum(STUDENT_STATUSES).nullable().catch(NO_STUDENT_FILTERS.status),
  inactiveDays: z.coerce
    .number()
    .pipe(z.union([z.literal(7), z.literal(14), z.literal(30)]))
    .nullable()
    .catch(NO_STUDENT_FILTERS.inactiveDays),
});

export function parseStudentFilters(params: URLSearchParams): StudentFilters {
  return filtersSchema.parse({
    page: params.get("page") ?? NO_STUDENT_FILTERS.page,
    status: params.get("status"),
    inactiveDays: params.get("inactive"),
  });
}

export function toStudentSearchParams(filters: StudentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page !== NO_STUDENT_FILTERS.page) params.set("page", String(filters.page));
  if (filters.status !== null) params.set("status", filters.status);
  if (filters.inactiveDays !== null) params.set("inactive", String(filters.inactiveDays));
  return params;
}

export function hasStudentFilters(filters: StudentFilters): boolean {
  return filters.status !== null || filters.inactiveDays !== null;
}
