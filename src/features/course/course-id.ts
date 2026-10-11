import { z } from "zod";

const courseIdSchema = z.coerce.number().int().positive();

export function parseCourseId(value: string | undefined): number | null {
  const parsed = courseIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
