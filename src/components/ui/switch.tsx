import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

interface SwitchFieldProps extends ComponentProps<typeof SwitchPrimitive.Root> {
  label: string;
  description?: string;
}

export function SwitchField({ label, description, id, className, ...props }: SwitchFieldProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold text-ink-soft">{label}</span>
        {description ? <span className="block text-small text-muted">{description}</span> : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-line-strong bg-sunken transition-colors data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600"
        {...props}
      >
        <SwitchPrimitive.Thumb className="block size-[18px] translate-x-[3px] rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
    </div>
  );
}
