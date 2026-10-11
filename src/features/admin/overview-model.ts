import type { AdminOverview } from "@/api/types";

const PERCENT = 100;

function count(group: Record<string, number>, key: string): number {
  return group[key] ?? 0;
}

export function studentsCount(overview: AdminOverview): number {
  return count(overview.users, "student");
}

export function teachersCount(overview: AdminOverview): number {
  return count(overview.users, "teacher");
}

export function publishedCourses(overview: AdminOverview): number {
  return count(overview.courses, "published");
}

export function totalCourses(overview: AdminOverview): number {
  return Object.values(overview.courses).reduce((sum, value) => sum + value, 0);
}

export function paidEnrollments(overview: AdminOverview): number {
  return count(overview.enrollments, "active") + count(overview.enrollments, "completed");
}

export function completionRate(overview: AdminOverview): number | null {
  const paid = paidEnrollments(overview);
  if (paid === 0) return null;
  return Math.round((count(overview.enrollments, "completed") * PERCENT) / paid);
}
