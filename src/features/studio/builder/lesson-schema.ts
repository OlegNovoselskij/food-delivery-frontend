import { z } from "zod";

export const LESSON_TYPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
] as const;

const TITLE_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 50_000;
const MAX_DURATION_MINUTES = 1000;

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(TITLE_MAX_LENGTH, `Use at most ${TITLE_MAX_LENGTH} characters`),
  content: z.string().max(CONTENT_MAX_LENGTH, `Use at most ${CONTENT_MAX_LENGTH} characters`),
  lesson_type: z.enum(["video", "article"]),
  duration: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) <= MAX_DURATION_MINUTES),
      `Enter whole minutes from 0 to ${MAX_DURATION_MINUTES}`,
    ),
  is_preview: z.boolean(),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;

export function isLessonType(value: string): value is LessonFormValues["lesson_type"] {
  return LESSON_TYPE_OPTIONS.some((option) => option.value === value);
}

export function toLessonPayload(values: LessonFormValues) {
  return {
    title: values.title,
    content: values.content.trim() === "" ? null : values.content,
    lesson_type: values.lesson_type,
    duration_minutes: values.duration === "" ? null : Number(values.duration),
    is_preview: values.is_preview,
  };
}
