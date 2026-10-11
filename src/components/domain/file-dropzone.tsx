import { Upload, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import type { UploadState } from "@/hooks/use-upload-flow";
import { cn } from "@/lib/cn";
import { validateFile, type FileRules } from "@/lib/file-rules";

const PERCENT = 100;

interface FileDropzoneProps {
  label: string;
  rules: FileRules;
  state: UploadState;
  onFile: (file: File) => void;
  onCancel: () => void;
  onDismissError: () => void;
  disabled?: boolean;
}

export function FileDropzone({
  label,
  rules,
  state,
  onFile,
  onCancel,
  onDismissError,
  disabled = false,
}: FileDropzoneProps) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const busy = state.status === "uploading" || state.status === "confirming";

  function accept(file: File | undefined): void {
    if (file === undefined || busy || disabled) return;
    const problem = validateFile(file, rules);
    setValidationError(problem);
    if (problem === null) {
      onDismissError();
      onFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  const progress = state.status === "uploading" ? Math.round(state.progress * PERCENT) : null;
  const errorMessage = validationError ?? (state.status === "failed" ? state.message : null);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy && !disabled) setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={handleDrop}
      className={cn(
        "rounded-card border border-dashed border-line-strong bg-surface p-4",
        dragging && "border-brand-600 bg-brand-50",
      )}
    >
      <input
        id={inputId}
        ref={input}
        type="file"
        accept={rules.types.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        disabled={busy || disabled}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {state.status === "uploading" || state.status === "confirming" ? (
        <div className="flex items-start gap-3">
          <Upload aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-semibold">{state.fileName}</p>
              {progress !== null ? <p className="font-semibold">{progress}%</p> : null}
            </div>
            <p className="text-small text-muted">
              {state.status === "uploading" ? "Uploading" : "Finishing up"}
            </p>
            <div
              role="progressbar"
              aria-label={`Uploading ${state.fileName}`}
              aria-valuemin={0}
              aria-valuemax={PERCENT}
              aria-valuenow={progress ?? PERCENT}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-strong"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
                style={{ width: `${progress ?? PERCENT}%` }}
              />
            </div>
          </div>
          {state.status === "uploading" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Cancel upload"
              onClick={onCancel}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Upload aria-hidden="true" className="size-5 shrink-0 text-ink-soft" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{label}</p>
            <p className="text-small text-muted">Drop a file here. {rules.hint}.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => {
              input.current?.click();
            }}
          >
            Choose file
          </Button>
        </div>
      )}
      {errorMessage ? (
        <p role="alert" className="mt-3 text-small text-danger-ink">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
