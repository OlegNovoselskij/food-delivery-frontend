import { type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface ReportSectionProps {
  title: string;
  description: string;
  state: ReportState;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ReportSection({
  title,
  description,
  state,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  action,
  children,
}: ReportSectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-h2">
            {title}
          </h2>
          <p className="mt-1 text-muted">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">
        {state.isPending ? (
          <div role="status" aria-label={`Loading ${title.toLowerCase()}`} className="grid gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : null}
        {state.isError ? (
          <ErrorState
            error={state.error}
            title={`Could not load ${title.toLowerCase()}`}
            onRetry={() => {
              void state.refetch();
            }}
          />
        ) : null}
        {!state.isPending && !state.isError && isEmpty ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        ) : null}
        {!state.isPending && !state.isError && !isEmpty ? children : null}
      </div>
    </section>
  );
}
