import { cn } from "@/lib/cn";

interface ProgressTrackProps {
  segments: readonly number[];
  label: string;
  className?: string;
}

const PERCENT = 100;

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function overallPercent(segments: readonly number[]): number {
  if (segments.length === 0) return 0;
  const total = segments.reduce((sum, value) => sum + clampFraction(value), 0);
  return Math.round((total / segments.length) * PERCENT);
}

export function ProgressTrack({ segments, label, className }: ProgressTrackProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={PERCENT}
      aria-valuenow={overallPercent(segments)}
      className={cn("flex w-full items-center gap-1.5", className)}
    >
      {segments.map((value, index) => (
        <span
          key={index}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-brand-600 transition-[width] duration-200"
            style={{ width: `${clampFraction(value) * PERCENT}%` }}
          />
        </span>
      ))}
    </div>
  );
}
