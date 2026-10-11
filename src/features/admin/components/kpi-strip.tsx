import { useQuery } from "@tanstack/react-query";

import { KpiGrid, StatCard } from "@/components/domain/stat-card";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";

import { overviewQuery, revenueQuery } from "../api";
import { totalRevenue } from "../chart-model";
import {
  completionRate,
  paidEnrollments,
  publishedCourses,
  studentsCount,
  teachersCount,
  totalCourses,
} from "../overview-model";
import { rangeLabel, type Period, type RangeValue } from "../range";

interface KpiStripProps {
  period: Period;
  range: RangeValue;
}

export function KpiStrip({ period, range }: KpiStripProps) {
  const overview = useQuery(overviewQuery());
  const revenue = useQuery(revenueQuery(period));

  if (overview.isPending) {
    return (
      <div role="status" aria-label="Loading key numbers">
        <KpiGrid>
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </KpiGrid>
      </div>
    );
  }
  if (overview.isError) {
    return (
      <ErrorState
        error={overview.error}
        title="Could not load the key numbers"
        onRetry={() => {
          void overview.refetch();
        }}
      />
    );
  }

  const data = overview.data;
  const completion = completionRate(data);

  return (
    <KpiGrid>
      <StatCard
        label={`Revenue, last ${rangeLabel(range)}`}
        value={revenue.data ? formatMoney(totalRevenue(revenue.data.items)) : "Loading"}
        footnote={`${formatMoney(data.revenue)} all time, ${formatMoney(data.refunded)} refunded`}
      />
      <StatCard
        label="Paid enrollments"
        value={String(paidEnrollments(data))}
        footnote={`${data.certificates} certificates issued`}
      />
      <StatCard
        label="Students"
        value={String(studentsCount(data))}
        footnote={`${teachersCount(data)} teachers`}
      />
      <StatCard
        label="Completion rate"
        value={completion === null ? "No data" : `${completion}%`}
        footnote={`${publishedCourses(data)} of ${totalCourses(data)} courses published`}
      />
    </KpiGrid>
  );
}
