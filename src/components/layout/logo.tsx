import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
}

export function LogoMark({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <rect
        x="9.5"
        y="9.5"
        width="13"
        height="13"
        rx="2.5"
        transform="rotate(45 16 16)"
        className="fill-amber-500"
      />
    </svg>
  );
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-h3 font-bold tracking-tight text-ink">Atrium</span>
    </span>
  );
}
