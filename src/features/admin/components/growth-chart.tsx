import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ReportTable, Td, Th } from "@/components/domain/report-table";

import { growthQuery } from "../api";
import { axisLabel, tooltipLabel, growthSummary, periodLabel } from "../chart-model";
import type { Period } from "../range";
import { ChartCard } from "./chart-card";

export function GrowthChart({ period }: { period: Period }) {
  const growth = useQuery(growthQuery(period));
  const points = growth.data?.items ?? [];
  const groupBy = period.group_by;

  return (
    <ChartCard
      title="New users"
      unit={`Sign-ups per ${groupBy}`}
      summary={growthSummary(points, growth.data?.totals ?? { students: 0, teachers: 0 })}
      state={growth}
      isEmpty={points.length === 0}
      emptyTitle="No new users in this period"
      emptyDescription="Sign-ups show up here as people join the platform."
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={(value: string) => axisLabel(value, groupBy)}
              stroke="var(--color-muted)"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--color-muted)"
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              labelFormatter={(value) => tooltipLabel(value, groupBy)}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                color: "var(--color-ink)",
              }}
            />
            <Legend />
            <Bar
              dataKey="students"
              isAnimationActive={false}
              name="Students"
              stackId="users"
              fill="var(--color-brand-600)"
            />
            <Bar
              dataKey="teachers"
              isAnimationActive={false}
              name="Teachers"
              stackId="users"
              fill="var(--color-art-amber)"
            />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <ReportTable label="New users">
          <thead>
            <tr>
              <Th>Period</Th>
              <Th className="text-right">Students</Th>
              <Th className="text-right">Teachers</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.period}>
                <Td>{periodLabel(point.period, groupBy)}</Td>
                <Td className="text-right">{point.students}</Td>
                <Td className="text-right">{point.teachers}</Td>
                <Td className="text-right font-semibold">{point.total}</Td>
              </tr>
            ))}
          </tbody>
        </ReportTable>
      }
    />
  );
}
