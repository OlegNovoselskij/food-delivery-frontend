const NO_DATA = "No data";

export function percentText(value: number | null): string {
  return value === null ? NO_DATA : `${Math.round(value)}%`;
}

export function inactiveText(days: number): string {
  if (days <= 0) return "Today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
