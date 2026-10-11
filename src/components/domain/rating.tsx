import { Star } from "lucide-react";

import { cn } from "@/lib/cn";

const MAX_STARS = 5;
const STAR_STEPS = Array.from({ length: MAX_STARS }, (_, index) => index);
const RATING_DIGITS = 1;

export function formatRating(value: number): string {
  return value.toFixed(RATING_DIGITS);
}

interface StarRowProps {
  value: number;
  className?: string;
}

export function StarRow({ value, className }: StarRowProps) {
  return (
    <span
      role="img"
      aria-label={`Rated ${formatRating(value)} out of ${MAX_STARS}`}
      className={cn("inline-flex gap-px text-amber-500", className)}
    >
      {STAR_STEPS.map((step) => (
        <Star
          key={step}
          aria-hidden="true"
          className={cn("size-4", value >= step + 0.5 ? "fill-current" : "text-line-strong")}
        />
      ))}
    </span>
  );
}

interface RatingBadgeProps {
  value: number | null;
  count: number;
  className?: string;
}

export function RatingBadge({ value, count, className }: RatingBadgeProps) {
  if (value === null) {
    return <span className={cn("text-small text-muted", className)}>New</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-small text-muted", className)}>
      <Star aria-hidden="true" className="size-3.5 fill-amber-500 text-amber-500" />
      <span className="sr-only">Rated</span>
      {formatRating(value)}
      <span>({count})</span>
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export function StarInput({ value, onChange, label, disabled = false }: StarInputProps) {
  const choose = (next: number) => {
    onChange(Math.min(MAX_STARS, Math.max(1, next)));
  };
  const move = (delta: number) => {
    choose(value === 0 ? 1 : value + delta);
  };

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1">
      {STAR_STEPS.map((step) => {
        const rating = step + 1;
        const checked = value === rating;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
            tabIndex={checked || (value === 0 && rating === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => {
              choose(rating);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                move(1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                move(-1);
              }
            }}
            className="flex size-9 items-center justify-center rounded-control hover:bg-sunken disabled:opacity-55"
          >
            <Star
              aria-hidden="true"
              className={cn(
                "size-6 text-amber-500",
                rating <= value ? "fill-current" : "text-line-strong",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
