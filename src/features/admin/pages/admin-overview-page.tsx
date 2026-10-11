import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";

import {
  COURSE_PREVIEW_LIMIT,
  TOP_TEACHERS_LIMIT,
  adminCoursesQuery,
  teachersQuery,
  type BreakdownDimension,
} from "../api";
import { BreakdownSection } from "../components/breakdown-section";
import { CourseTable } from "../components/course-table";
import { ExportMenu } from "../components/export-menu";
import { GrowthChart } from "../components/growth-chart";
import { KpiStrip } from "../components/kpi-strip";
import { RangeSwitch, useRange } from "../components/range-switch";
import { RevenueChart } from "../components/revenue-chart";
import { TableCard } from "../components/table-card";
import { TeacherTable } from "../components/teacher-table";
import { usePeriod } from "../use-period";

const ADMIN_PANEL_URL = `${env.apiUrl}/admin`;

function TopTeachers({ period }: { period: ReturnType<typeof usePeriod> }) {
  const teachers = useQuery(teachersQuery(period, "revenue", TOP_TEACHERS_LIMIT));
  const rows = teachers.data?.items ?? [];
  return (
    <TableCard
      title="Top teachers"
      state={teachers}
      isEmpty={rows.length === 0}
      emptyTitle="No teachers yet"
      emptyDescription="Teachers appear here once they publish courses."
      aside={
        <Button asChild variant="link">
          <Link to="/admin/teachers">View all</Link>
        </Button>
      }
    >
      <TeacherTable rows={rows} detailed={false} />
    </TableCard>
  );
}

function CoursePerformance({ period }: { period: ReturnType<typeof usePeriod> }) {
  const courses = useQuery(adminCoursesQuery(period, "students", null, COURSE_PREVIEW_LIMIT));
  const rows = courses.data?.items ?? [];
  return (
    <TableCard
      title="Course performance"
      state={courses}
      isEmpty={rows.length === 0}
      emptyTitle="No courses yet"
      emptyDescription="Courses appear here once teachers create them."
      aside={
        <div className="flex items-center gap-3">
          <Badge tone="neutral">Top {COURSE_PREVIEW_LIMIT} by students</Badge>
          <Button asChild variant="link">
            <Link to="/admin/courses">View all</Link>
          </Button>
        </div>
      }
    >
      <CourseTable rows={rows} detailed={false} />
    </TableCard>
  );
}

export function Component() {
  const { range, setRange } = useRange();
  const period = usePeriod(range);
  const [breakdownBy, setBreakdownBy] = useState<BreakdownDimension>("course");

  return (
    <div className="container-page flex flex-col gap-6 py-8">
      <title>Platform overview · Atrium</title>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Platform overview</h1>
        <div className="flex flex-wrap items-center gap-3">
          <RangeSwitch range={range} onChange={setRange} />
          <ExportMenu period={period} options={{ breakdownBy }} />
          <Button asChild variant="ghost">
            <a href={ADMIN_PANEL_URL} target="_blank" rel="noreferrer">
              Admin panel
              <ExternalLink aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </header>
      <KpiStrip period={period} range={range} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RevenueChart period={period} />
        <TopTeachers period={period} />
      </div>
      <BreakdownSection period={period} by={breakdownBy} onChange={setBreakdownBy} />
      <GrowthChart period={period} />
      <CoursePerformance period={period} />
    </div>
  );
}
