import type { LessonSummary, Program } from "@/api/types";

export function firstPreviewLesson(program: Program): LessonSummary | null {
  for (const module of program.modules) {
    const lesson = module.lessons.find((candidate) => candidate.is_preview);
    if (lesson) return lesson;
  }
  return null;
}

export function quizCount(program: Program): number {
  return program.modules.filter((module) => module.has_quiz).length;
}

export function formatTotalDuration(minutes: number): string {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function lessonPath(courseId: number, lessonId: number): string {
  return `/learning/courses/${courseId}/lessons/${lessonId}`;
}
