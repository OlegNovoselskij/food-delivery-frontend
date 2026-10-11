import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/cn";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) onChange(match.value);
      }}
      className={cn("inline-flex rounded-control bg-sunken p-1", className)}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="h-8 rounded-[8px] px-3 text-small font-semibold text-ink-soft hover:text-ink data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:border data-[state=on]:border-line"
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
