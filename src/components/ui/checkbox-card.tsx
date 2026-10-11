import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

interface CheckboxCardProps extends ComponentProps<typeof CheckboxPrimitive.Root> {
  label: string;
}

export function CheckboxCard({ label, className, id, ...props }: CheckboxCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-control border border-line-strong bg-surface p-3.5 has-[[data-state=checked]]:border-brand-600 has-[[data-state=checked]]:bg-brand-50",
        className,
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-line-strong bg-surface data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600"
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden="true" className="size-3.5 text-on-brand" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className="font-medium text-ink">{label}</span>
    </label>
  );
}
