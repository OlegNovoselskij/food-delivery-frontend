import type { LessonProgress, ModuleProgress, Progress, ProgressSummary } from "@/api/types";
import { percentOf } from "@/features/learning/progress-model";

interface LessonSpec {
  id: number;
  title?: string;
  minutes?: number;
  completed?: boolean;
}

interface ModuleSpec {
  id: number;
  title?: string;
  lessons: LessonSpec[];
  quiz?: { id: number; passed: boolean };
}

export function buildSummary(overrides: Partial<ProgressSummary> = {}): ProgressSummary {
  return {
    percent: 0,
    lessons_total: 0,
    lessons_completed: 0,
    quizzes_total: 0,
    quizzes_passed: 0,
    minutes_total: 0,
    minutes_completed: 0,
    ...overrides,
  };
}

function buildModuleProgress(spec: ModuleSpec, position: number): ModuleProgress {
  const lessons: LessonProgress[] = spec.lessons.map((lesson, index) => ({
    id: lesson.id,
    title: lesson.title ?? `Lesson ${lesson.id}`,
    position: index + 1,
    duration_minutes: lesson.minutes ?? 10,
    completed: lesson.completed ?? false,
    completed_at: lesson.completed ? "2026-03-01T10:00:00Z" : null,
  }));
  const lessonsCompleted = lessons.filter((lesson) => lesson.completed).length;
  const quizzesTotal = spec.quiz ? 1 : 0;
  const quizzesPassed = spec.quiz?.passed ? 1 : 0;
  return {
    id: spec.id,
    title: spec.title ?? `Module ${spec.id}`,
    position,
    progress: buildSummary({
      lessons_total: lessons.length,
      lessons_completed: lessonsCompleted,
      quizzes_total: quizzesTotal,
      quizzes_passed: quizzesPassed,
      minutes_total: lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes ?? 0), 0),
      minutes_completed: lessons
        .filter((lesson) => lesson.completed)
        .reduce((sum, lesson) => sum + (lesson.duration_minutes ?? 0), 0),
      percent: percentOf(lessonsCompleted + quizzesPassed, lessons.length + quizzesTotal),
    }),
    quiz: spec.quiz ? { id: spec.quiz.id, title: "Module quiz", passed: spec.quiz.passed } : null,
    lessons,
  };
}

export function buildProgressFor(
  modules: ModuleSpec[],
  overrides: Partial<Progress> = {},
): Progress {
  const moduleProgress = modules.map((module, index) => buildModuleProgress(module, index + 1));
  const total = moduleProgress.reduce(
    (sum, module) => ({
      lessons: sum.lessons + module.progress.lessons_total,
      lessonsDone: sum.lessonsDone + module.progress.lessons_completed,
      quizzes: sum.quizzes + module.progress.quizzes_total,
      quizzesDone: sum.quizzesDone + module.progress.quizzes_passed,
      minutes: sum.minutes + module.progress.minutes_total,
      minutesDone: sum.minutesDone + module.progress.minutes_completed,
    }),
    { lessons: 0, lessonsDone: 0, quizzes: 0, quizzesDone: 0, minutes: 0, minutesDone: 0 },
  );
  const firstOpen = moduleProgress
    .flatMap((module) => module.lessons)
    .find((lesson) => !lesson.completed);
  return {
    enrollment_id: 11,
    course_id: 1,
    enrollment_status: "active",
    progress: buildSummary({
      lessons_total: total.lessons,
      lessons_completed: total.lessonsDone,
      quizzes_total: total.quizzes,
      quizzes_passed: total.quizzesDone,
      minutes_total: total.minutes,
      minutes_completed: total.minutesDone,
      percent: percentOf(total.lessonsDone + total.quizzesDone, total.lessons + total.quizzes),
    }),
    next_lesson_id: firstOpen?.id ?? null,
    modules: moduleProgress,
    ...overrides,
  };
}
