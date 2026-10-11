import { format, startOfMonth, subDays, subMonths } from "date-fns";

export const RANGES = [
  { value: "30d", label: "30 days", groupBy: "day" },
  { value: "90d", label: "90 days", groupBy: "week" },
  { value: "12m", label: "12 months", groupBy: "month" },
] as const;

export type RangeValue = (typeof RANGES)[number]["value"];
export type GroupBy = (typeof RANGES)[number]["groupBy"];

export const DEFAULT_RANGE: RangeValue = "12m";
export const RANGE_PARAM = "range";

const API_DATE_PATTERN = "yyyy-MM-dd";
const SHORT_DAYS = 30;
const MEDIUM_DAYS = 90;
const MONTHS_IN_YEAR = 12;

export interface Period {
  date_from: string;
  date_to: string;
  group_by: GroupBy;
}

export function isRangeValue(value: string | null): value is RangeValue {
  return RANGES.some((range) => range.value === value);
}

export function parseRange(params: URLSearchParams): RangeValue {
  const value = params.get(RANGE_PARAM);
  return isRangeValue(value) ? value : DEFAULT_RANGE;
}

export function rangeLabel(range: RangeValue): string {
  return RANGES.find((entry) => entry.value === range)?.label ?? range;
}

function startFor(range: RangeValue, now: Date): Date {
  switch (range) {
    case "30d":
      return subDays(now, SHORT_DAYS - 1);
    case "90d":
      return subDays(now, MEDIUM_DAYS - 1);
    case "12m":
      return startOfMonth(subMonths(now, MONTHS_IN_YEAR - 1));
  }
}

export function periodFor(range: RangeValue, now: Date): Period {
  const groupBy = RANGES.find((entry) => entry.value === range)?.groupBy ?? "month";
  return {
    date_from: format(startFor(range, now), API_DATE_PATTERN),
    date_to: format(now, API_DATE_PATTERN),
    group_by: groupBy,
  };
}
