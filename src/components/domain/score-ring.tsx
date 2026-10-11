import { cn } from "@/lib/cn";

const RADIUS = 52;
const STROKE = 10;
const SIZE = 128;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PERCENT = 100;

interface ScoreRingProps {
  score: number;
  passed: boolean;
  className?: string;
}

export function ScoreRing({ score, passed, className }: ScoreRingProps) {
  const clamped = Math.min(PERCENT, Math.max(0, score));
  const offset = CIRCUMFERENCE * (1 - clamped / PERCENT);

  return (
    <div
      role="img"
      aria-label={`Score ${clamped} percent, ${passed ? "passed" : "not passed"}`}
      className={cn("relative size-32 shrink-0", className)}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="size-full -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-line-strong"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={passed ? "stroke-success-600" : "stroke-danger-600"}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[1.75rem] font-bold tracking-tight">
        {clamped}%
      </span>
    </div>
  );
}
