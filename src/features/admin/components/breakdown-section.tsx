import { useQuery } from "@tanstack/react-query";
import { PieChart } from "lucide-react";

import { ReportTable, Td, Th } from "@/components/domain/report-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";

import { BREAKDOWN_DIMENSIONS, breakdownQuery, type BreakdownDimension } from "../api";
import type { Period } from "../range";

const DIMENSION_OPTIONS = BREAKDOWN_DIMENSIONS.map((value) => ({
  value,
  label: value === "course" ? "Courses" : value === "teacher" ? "Teachers" : "Categories",
}));

const DIMENSION_NOUN: Record<BreakdownDimension, string> = {
  course: "Course",
  teacher: "Teacher",
  category: "Category",
};

const PERCENT = 100;

interface BreakdownSectionProps {
  period: Period;
  by: BreakdownDimension;
  onChange: (by: BreakdownDimension) => void;
}

export function BreakdownSection({ period, by, onChange }: BreakdownSectionProps) {
  const breakdown = useQuery(breakdownQuery(period, by));
  const rows = breakdown.data?.items ?? [];
  const total = Number(breakdown.data?.total_revenue ?? 0);

  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="breakdown-heading" className="text-h3 font-semibold">
            Revenue breakdown
          </h2>
          <p className="text-small text-muted">Where the money comes from in this period</p>
        </div>
        <SegmentedControl
          label="Break revenue down by"
          value={by}
          options={DIMENSION_OPTIONS}
          onChange={onChange}
        />
      </div>
      <div className="mt-4">
        {breakdown.isPending ? (
          <div role="status" aria-label="Loading revenue breakdown">
            <Skeleton className="h-40" />
          </div>
        ) : null}
        {breakdown.isError ? (
          <ErrorState
            error={breakdown.error}
            title="Could not load the revenue breakdown"
            onRetry={() => {
              void breakdown.refetch();
            }}
          />
        ) : null}
        {breakdown.data && rows.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="No revenue in this period"
            description="Paid enrollments show up here grouped by course, teacher or category."
          />
        ) : null}
        {rows.length > 0 ? (
          <ReportTable label={`Revenue by ${by}`}>
            <thead>
              <tr>
                <Th>{DIMENSION_NOUN[by]}</Th>
                <Th className="text-right">Payments</Th>
                <Th className="text-right">Refunded</Th>
                <Th className="w-1/3">Share</Th>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const share = total === 0 ? 0 : (Number(row.revenue) * PERCENT) / total;
                return (
                  <tr key={row.id}>
                    <Td className="font-semibold">{row.name}</Td>
                    <Td className="text-right">{row.payments}</Td>
                    <Td className="text-right">{formatMoney(row.refunded)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-strong">
                          <div className="h-full bg-brand-600" style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-10 text-right text-small">{Math.round(share)}%</span>
                      </div>
                    </Td>
                    <Td className="text-right font-semibold">{formatMoney(row.revenue)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </ReportTable>
        ) : null}
      </div>
    </section>
  );
}
