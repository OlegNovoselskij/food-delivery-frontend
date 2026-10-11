import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} />;
}

interface RadioCardProps extends ComponentProps<typeof RadioGroupPrimitive.Item> {
  label: string;
  description?: string;
}

export function RadioCard({ label, description, className, id, ...props }: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-control border border-line-strong bg-surface p-3.5 has-[[data-state=checked]]:border-brand-600 has-[[data-state=checked]]:bg-brand-50",
        className,
      )}
    >
      <RadioGroupPrimitive.Item
        id={id}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface data-[state=checked]:border-brand-600"
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-brand-600" />
      </RadioGroupPrimitive.Item>
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {description ? <span className="block text-small text-muted">{description}</span> : null}
      </span>
    </label>
  );
}
