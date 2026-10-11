import { Table2 } from "lucide-react";
import { useId, type ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface QueryState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface TableCardProps {
  title: string;
  aside?: ReactNode;
  state: QueryState;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  className?: string;
}

export function TableCard({
  title,
  aside,
  state,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
  className,
}: TableCardProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn("min-w-0 rounded-panel border border-line bg-surface p-5 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-h3 font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">
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
          <EmptyState icon={Table2} title={emptyTitle} description={emptyDescription} />
        ) : null}
        {!state.isPending && !state.isError && !isEmpty ? children : null}
      </div>
    </section>
  );
}
