import { useId, type ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

interface TextareaFieldProps extends ComponentProps<"textarea"> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function TextareaField({ label, error, hint, id, className, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-28 w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body text-ink placeholder:text-muted focus-visible:border-brand-600 disabled:opacity-55 aria-invalid:border-danger-600",
          className,
        )}
        {...props}
      />
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
