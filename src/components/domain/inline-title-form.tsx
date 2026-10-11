import { useEffect, useId, useRef, useState, type SubmitEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE_MAX_LENGTH = 200;

interface InlineTitleFormProps {
  label: string;
  initialValue?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export function InlineTitleForm({
  label,
  initialValue = "",
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: InlineTitleFormProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (trimmed !== "" && !pending) onSubmit(trimmed);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor={inputId} className="sr-only">
          {label}
        </Label>
        <Input
          id={inputId}
          ref={inputRef}
          value={value}
          maxLength={TITLE_MAX_LENGTH}
          placeholder={label}
          className="h-10"
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      <Button type="submit" size="sm" disabled={trimmed === "" || pending}>
        {pending ? "Saving" : submitLabel}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}
