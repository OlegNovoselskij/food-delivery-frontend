import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex h-[22px] items-center gap-1 rounded-md px-2 text-micro font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        brand: "bg-brand-50 text-brand-700",
        neutral: "bg-sunken text-ink-soft",
        success: "bg-success-50 text-success-600",
        warning: "bg-warning-50 text-warning-600",
        danger: "bg-danger-50 text-danger-600",
        amber: "bg-amber-50 text-warning-600",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
