import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ReportTable, Td, Th } from "@/components/domain/report-table";
import { formatCompactMoney, formatMoney } from "@/lib/money";

import { revenueQuery } from "../api";
import {
  axisLabel,
  tooltipLabel,
  periodLabel,
  revenueSummary,
  toRevenueData,
} from "../chart-model";
import type { Period } from "../range";
import { ChartCard } from "./chart-card";

const GRADIENT_ID = "revenue-fill";

export function RevenueChart({ period }: { period: Period }) {
  const revenue = useQuery(revenueQuery(period));
  const points = revenue.data?.items ?? [];
  const data = toRevenueData(points);
  const groupBy = period.group_by;

  return (
    <ChartCard
      title="Revenue over time"
      unit={`USD per ${groupBy}`}
      summary={revenueSummary(points, groupBy)}
      state={revenue}
      isEmpty={points.length === 0}
      emptyTitle="No revenue in this period"
      emptyDescription="Payments show up here as students enroll in paid courses."
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value: number) => formatCompactMoney(value)}
              stroke="var(--color-muted)"
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              labelFormatter={(value) => tooltipLabel(value, groupBy)}
              formatter={(value) => [formatMoney(Number(value)), "Revenue"]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                color: "var(--color-ink)",
              }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-brand-600)"
              strokeWidth={2.5}
              fill={`url(#${GRADIENT_ID})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      }
      table={
        <ReportTable label="Revenue over time">
          <thead>
            <tr>
              <Th>Period</Th>
              <Th className="text-right">Revenue</Th>
              <Th className="text-right">Refunded</Th>
              <Th className="text-right">Payments</Th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.period}>
                <Td>{periodLabel(point.period, groupBy)}</Td>
                <Td className="text-right font-semibold">{formatMoney(point.revenue)}</Td>
                <Td className="text-right">{formatMoney(point.refunded)}</Td>
                <Td className="text-right">{point.payments}</Td>
              </tr>
            ))}
          </tbody>
        </ReportTable>
      }
    />
  );
}
