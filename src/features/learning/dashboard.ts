import type { HistoryItem, Progress } from "@/api/types";
import { ENROLLMENT_STATUS } from "@/features/enrollment";

import { minutesLeft, modulesCompleted } from "./progress-model";

export interface DashboardGroups {
  active: HistoryItem[];
  pending: HistoryItem[];
  completed: HistoryItem[];
  cancelled: HistoryItem[];
}

function activityTime(item: HistoryItem): number {
  return Date.parse(item.last_activity_at ?? item.enrollment.enrolled_at);
}

export function groupHistory(items: readonly HistoryItem[]): DashboardGroups {
  const byStatus = (status: string) => items.filter((item) => item.enrollment.status === status);
  return {
    active: byStatus(ENROLLMENT_STATUS.active).sort((a, b) => activityTime(b) - activityTime(a)),
    pending: byStatus(ENROLLMENT_STATUS.pendingPayment),
    completed: byStatus(ENROLLMENT_STATUS.completed),
    cancelled: byStatus(ENROLLMENT_STATUS.cancelled),
  };
}

export interface DashboardStats {
  lessonsCompleted: number;
  coursesCompleted: number;
  minutesLearned: number;
}

export function computeStats(items: readonly HistoryItem[]): DashboardStats {
  const counted = items.filter((item) => item.enrollment.status !== ENROLLMENT_STATUS.cancelled);
  return {
    lessonsCompleted: counted.reduce((sum, item) => sum + item.progress.lessons_completed, 0),
    coursesCompleted: items.filter((item) => item.enrollment.status === ENROLLMENT_STATUS.completed)
      .length,
    minutesLearned: counted.reduce((sum, item) => sum + item.progress.minutes_completed, 0),
  };
}

export function recentActivity(items: readonly HistoryItem[], limit: number): HistoryItem[] {
  return items
    .filter((item) => item.last_activity_at !== null)
    .sort((a, b) => activityTime(b) - activityTime(a))
    .slice(0, limit);
}

export interface ResumeTarget {
  item: HistoryItem;
  progress: Progress;
  lessonId: number;
  lessonTitle: string;
  moduleNumber: number;
  moduleCount: number;
  minutesLeft: number;
}

export function resumeTarget(
  item: HistoryItem,
  progress: Progress | undefined,
): ResumeTarget | null {
  if (progress === undefined) return null;
  if (progress.next_lesson_id === null) return null;
  const moduleIndex = progress.modules.findIndex((module) =>
    module.lessons.some((lesson) => lesson.id === progress.next_lesson_id),
  );
  const module = progress.modules[moduleIndex];
  if (module === undefined) return null;
  const lesson = module.lessons.find((candidate) => candidate.id === progress.next_lesson_id);
  if (lesson === undefined) return null;
  return {
    item,
    progress,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    moduleNumber: moduleIndex + 1,
    moduleCount: progress.modules.length,
    minutesLeft: minutesLeft(progress.progress),
  };
}

export function moduleProgressLabel(progress: Progress): string {
  const total = progress.modules.length;
  return `${modulesCompleted(progress)} of ${total} ${total === 1 ? "module" : "modules"}`;
}
