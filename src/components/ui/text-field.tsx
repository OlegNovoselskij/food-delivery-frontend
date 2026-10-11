import type { LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  trailing?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  icon: Icon,
  trailing,
  id,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted"
          />
        ) : null}
        <Input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(Icon && "pl-10", trailing && "pr-11", className)}
          {...props}
        />
        {trailing ? (
          <div className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-small text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
