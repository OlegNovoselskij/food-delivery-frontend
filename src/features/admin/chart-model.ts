import { format, parseISO } from "date-fns";

import type { GrowthPoint, RevenuePoint } from "@/api/types";
import { formatMoney } from "@/lib/money";

import type { GroupBy } from "./range";

const LABEL_PATTERNS: Record<GroupBy, string> = {
  day: "MMM d",
  week: "MMM d",
  month: "MMM yyyy",
};

const AXIS_PATTERNS: Record<GroupBy, string> = {
  day: "d MMM",
  week: "d MMM",
  month: "MMM",
};

export function periodLabel(period: string, groupBy: GroupBy): string {
  return format(parseISO(period), LABEL_PATTERNS[groupBy]);
}

export function axisLabel(period: string, groupBy: GroupBy): string {
  return format(parseISO(period), AXIS_PATTERNS[groupBy]);
}

export function tooltipLabel(value: unknown, groupBy: GroupBy): string {
  return typeof value === "string" ? periodLabel(value, groupBy) : "";
}

export interface RevenueDatum {
  period: string;
  revenue: number;
  refunded: number;
  payments: number;
}

export function toRevenueData(points: readonly RevenuePoint[]): RevenueDatum[] {
  return points.map((point) => ({
    period: point.period,
    revenue: Number(point.revenue),
    refunded: Number(point.refunded),
    payments: point.payments,
  }));
}

export function totalRevenue(points: readonly RevenuePoint[]): number {
  return points.reduce((sum, point) => sum + Number(point.revenue), 0);
}

export function revenueSummary(points: readonly RevenuePoint[], groupBy: GroupBy): string {
  const peak = points.reduce<RevenuePoint | null>(
    (best, point) => (best === null || Number(point.revenue) > Number(best.revenue) ? point : best),
    null,
  );
  const total = formatMoney(totalRevenue(points));
  if (peak === null) return "No revenue in this period.";
  return `${total} in total across ${points.length} ${points.length === 1 ? "period" : "periods"}. The best one was ${periodLabel(peak.period, groupBy)} with ${formatMoney(peak.revenue)}.`;
}

export function growthSummary(
  points: readonly GrowthPoint[],
  totals: { students: number; teachers: number },
): string {
  const students = `${totals.students} new ${totals.students === 1 ? "student" : "students"}`;
  const teachers = `${totals.teachers} new ${totals.teachers === 1 ? "teacher" : "teachers"}`;
  if (points.length === 0) return "No new users in this period.";
  return `${students} and ${teachers} joined in this period.`;
}
