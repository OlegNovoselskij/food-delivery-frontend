import { TriangleAlert } from "lucide-react";

import { toApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Could not load this page",
  className,
}: ErrorStateProps) {
  const apiError = toApiError(error);
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-8",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-control bg-danger-50 text-danger-600">
        <TriangleAlert aria-hidden="true" className="size-5" />
      </span>
      <h2 className="text-h3">{title}</h2>
      <p className="max-w-prose text-muted">{apiError.message}</p>
      {apiError.requestId ? (
        <p className="text-small text-muted">Request ID: {apiError.requestId}</p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
