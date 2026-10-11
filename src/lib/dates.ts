import { format, formatDistanceToNow, parseISO } from "date-fns";

const DATE_PATTERN = "MMM d, yyyy";

export function formatDate(iso: string): string {
  return format(parseISO(iso), DATE_PATTERN);
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return "";
  return `${minutes} min`;
}
