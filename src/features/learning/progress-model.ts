import type { ModuleProgress, Progress, ProgressSummary } from "@/api/types";

const PERCENT = 100;

export function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.floor((done * PERCENT) / total);
}

function summaryWith(
  summary: ProgressSummary,
  lessonsCompleted: number,
  minutesCompleted: number,
): ProgressSummary {
  const itemsDone = lessonsCompleted + summary.quizzes_passed;
  const itemsTotal = summary.lessons_total + summary.quizzes_total;
  return {
    ...summary,
    lessons_completed: lessonsCompleted,
    minutes_completed: minutesCompleted,
    percent: percentOf(itemsDone, itemsTotal),
  };
}

function toggleInModule(
  module: ModuleProgress,
  lessonId: number,
  completed: boolean,
): ModuleProgress {
  const target = module.lessons.find((lesson) => lesson.id === lessonId);
  if (!target || target.completed === completed) return module;

  const minutes = target.duration_minutes ?? 0;
  const direction = completed ? 1 : -1;
  return {
    ...module,
    lessons: module.lessons.map((lesson) =>
      lesson.id === lessonId
        ? { ...lesson, completed, completed_at: completed ? new Date().toISOString() : null }
        : lesson,
    ),
    progress: summaryWith(
      module.progress,
      module.progress.lessons_completed + direction,
      module.progress.minutes_completed + direction * minutes,
    ),
  };
}

export function firstIncompleteLessonId(modules: readonly ModuleProgress[]): number | null {
  for (const module of modules) {
    const lesson = module.lessons.find((candidate) => !candidate.completed);
    if (lesson) return lesson.id;
  }
  return null;
}

export function applyLessonToggle(
  progress: Progress,
  lessonId: number,
  completed: boolean,
): Progress {
  const modules = progress.modules.map((module) => toggleInModule(module, lessonId, completed));
  const changed = modules.some((module, index) => module !== progress.modules[index]);
  if (!changed) return progress;

  const lessonsCompleted = modules.reduce(
    (sum, module) => sum + module.progress.lessons_completed,
    0,
  );
  const minutesCompleted = modules.reduce(
    (sum, module) => sum + module.progress.minutes_completed,
    0,
  );

  return {
    ...progress,
    modules,
    next_lesson_id: firstIncompleteLessonId(modules),
    progress: summaryWith(progress.progress, lessonsCompleted, minutesCompleted),
  };
}

export function moduleFractions(progress: Progress): number[] {
  return progress.modules.map((module) => module.progress.percent / PERCENT);
}

export function orderedLessonIds(progress: Progress): number[] {
  return progress.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
}

export function isLessonCompleted(progress: Progress, lessonId: number): boolean {
  return progress.modules.some((module) =>
    module.lessons.some((lesson) => lesson.id === lessonId && lesson.completed),
  );
}

export function minutesLeft(summary: ProgressSummary): number {
  return Math.max(0, summary.minutes_total - summary.minutes_completed);
}

export function modulesCompleted(progress: Progress): number {
  return progress.modules.filter((module) => module.progress.percent === PERCENT).length;
}
