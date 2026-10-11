import { describe, expect, it } from "vitest";

import type { AdminOverview, GrowthPoint, RevenuePoint } from "@/api/types";

import { growthSummary, revenueSummary, totalRevenue } from "./chart-model";
import {
  completionRate,
  paidEnrollments,
  publishedCourses,
  studentsCount,
  totalCourses,
} from "./overview-model";
import { parseRange, periodFor, rangeLabel } from "./range";

const NOW = new Date(2026, 9, 12);

function overview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    users: { student: 66, teacher: 3, admin: 1 },
    courses: { published: 6, draft: 10, archived: 3 },
    enrollments: { active: 40, completed: 10, pending_payment: 5, cancelled: 2 },
    revenue: "1223.00",
    refunded: "177.00",
    certificates: 10,
    reviews: 12,
    ...overrides,
  };
}

describe("periodFor", () => {
  it("covers 30 days ending today, grouped by day", () => {
    expect(periodFor("30d", NOW)).toEqual({
      date_from: "2026-09-13",
      date_to: "2026-10-12",
      group_by: "day",
    });
  });

  it("covers 90 days grouped by week", () => {
    expect(periodFor("90d", NOW)).toEqual({
      date_from: "2026-07-15",
      date_to: "2026-10-12",
      group_by: "week",
    });
  });

  it("covers twelve whole months grouped by month", () => {
    expect(periodFor("12m", NOW)).toEqual({
      date_from: "2025-11-01",
      date_to: "2026-10-12",
      group_by: "month",
    });
  });
});

describe("parseRange", () => {
  it("defaults to twelve months and ignores unknown values", () => {
    expect(parseRange(new URLSearchParams())).toBe("12m");
    expect(parseRange(new URLSearchParams("range=forever"))).toBe("12m");
    expect(parseRange(new URLSearchParams("range=30d"))).toBe("30d");
    expect(rangeLabel("90d")).toBe("90 days");
  });
});

describe("overview model", () => {
  it("derives the headline numbers", () => {
    const data = overview();
    expect(studentsCount(data)).toBe(66);
    expect(publishedCourses(data)).toBe(6);
    expect(totalCourses(data)).toBe(19);
    expect(paidEnrollments(data)).toBe(50);
    expect(completionRate(data)).toBe(20);
  });

  it("has no completion rate before anyone has paid", () => {
    expect(completionRate(overview({ enrollments: {} }))).toBeNull();
    expect(studentsCount(overview({ users: {} }))).toBe(0);
  });
});

describe("chart summaries", () => {
  const points: RevenuePoint[] = [
    { period: "2026-08-01", revenue: "100.00", refunded: "0", payments: 2 },
    { period: "2026-09-01", revenue: "300.50", refunded: "0", payments: 5 },
  ];

  it("adds up revenue and names the best period", () => {
    expect(totalRevenue(points)).toBeCloseTo(400.5);
    expect(revenueSummary(points, "month")).toBe(
      "$400.50 in total across 2 periods. The best one was Sep 2026 with $300.50.",
    );
  });

  it("says so when there is nothing to chart", () => {
    expect(revenueSummary([], "month")).toBe("No revenue in this period.");
    const none: GrowthPoint[] = [];
    expect(growthSummary(none, { students: 0, teachers: 0 })).toBe("No new users in this period.");
  });

  it("summarises sign-ups", () => {
    const growth: GrowthPoint[] = [{ period: "2026-10-01", students: 1, teachers: 1, total: 2 }];
    expect(growthSummary(growth, { students: 1, teachers: 1 })).toBe(
      "1 new student and 1 new teacher joined in this period.",
    );
  });
});
