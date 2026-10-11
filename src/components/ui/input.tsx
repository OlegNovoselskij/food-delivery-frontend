import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-muted focus-visible:border-brand-600 disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-danger-600",
        className,
      )}
      {...props}
    />
  );
}
