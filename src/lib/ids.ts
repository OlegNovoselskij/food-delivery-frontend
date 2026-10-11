import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export function parseId(value: string | undefined): number | null {
  const parsed = idSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
