import { z } from "zod";

import { isHttpUrl } from "@/lib/url";

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const COVER_MAX_LENGTH = 500;
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, `Use at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Use at most ${TITLE_MAX_LENGTH} characters`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `Use at most ${DESCRIPTION_MAX_LENGTH} characters`),
  category_id: z.number({ message: "Choose a category" }).int().positive("Choose a category"),
  level: z.enum(COURSE_LEVELS),
  price: z
    .string()
    .trim()
    .regex(PRICE_PATTERN, "Enter a price like 49 or 49.90, or 0 for a free course"),
  cover_url: z
    .string()
    .trim()
    .max(COVER_MAX_LENGTH, `Use at most ${COVER_MAX_LENGTH} characters`)
    .refine(
      (value) => value === "" || isHttpUrl(value),
      "Enter a link that starts with http or https",
    ),
});

export type CourseFormValues = z.infer<typeof courseSchema>;

export function isCourseLevel(value: string): value is CourseLevel {
  return COURSE_LEVELS.some((level) => level === value);
}

export function toCoursePayload(values: CourseFormValues) {
  return {
    title: values.title,
    description: values.description === "" ? null : values.description,
    category_id: values.category_id,
    level: values.level,
    price: values.price,
    cover_url: values.cover_url === "" ? null : values.cover_url,
  };
}
