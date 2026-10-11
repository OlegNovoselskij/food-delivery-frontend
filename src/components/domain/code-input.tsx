import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/cn";

const DEFAULT_LENGTH = 6;
const NON_DIGITS = /\D/g;

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  focusOnMount?: boolean;
  describedBy?: string | undefined;
}

function digitsOnly(text: string): string {
  return text.replace(NON_DIGITS, "");
}

export function CodeInput({
  value,
  onChange,
  label,
  length = DEFAULT_LENGTH,
  invalid = false,
  disabled = false,
  focusOnMount = false,
  describedBy,
}: CodeInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (focusOnMount) boxes.current[0]?.focus();
  }, [focusOnMount]);

  function focusBox(index: number): void {
    boxes.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  }

  function commit(next: string, focusIndex: number): void {
    onChange(next.slice(0, length));
    focusBox(focusIndex);
  }

  function handleChange(index: number, raw: string): void {
    const typed = digitsOnly(raw);
    if (typed === "") {
      commit(value.slice(0, index), index);
      return;
    }
    const position = Math.min(index, value.length);
    const next = value.slice(0, position) + typed + value.slice(position + 1);
    commit(next, position + typed.length);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace" && value[index] === undefined) {
      event.preventDefault();
      commit(value.slice(0, Math.max(index - 1, 0)), index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text")).slice(0, length);
    if (pasted === "") return;
    commit(pasted, pasted.length);
  }

  return (
    <div role="group" aria-label={label} className="flex gap-2 sm:gap-2.5">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            boxes.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={value[index] ?? ""}
          onChange={(event) => {
            handleChange(index, event.target.value);
          }}
          onKeyDown={(event) => {
            handleKeyDown(index, event);
          }}
          onPaste={handlePaste}
          className={cn(
            "h-[60px] min-w-0 max-w-[52px] flex-1 rounded-xl border border-line-strong bg-surface text-center text-[26px] font-semibold text-ink focus-visible:border-2 focus-visible:border-brand-600 disabled:opacity-55",
            invalid && "border-danger-600",
          )}
        />
      ))}
    </div>
  );
}
