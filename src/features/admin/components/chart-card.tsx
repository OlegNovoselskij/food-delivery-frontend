import { ChartColumn, Table2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface QueryState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface ChartCardProps {
  title: string;
  unit: string;
  summary: string;
  state: QueryState;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  unit,
  summary,
  state,
  isEmpty,
  emptyTitle,
  emptyDescription,
  chart,
  table,
  className,
}: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();
  const summaryId = useId();
  const ready = !state.isPending && !state.isError && !isEmpty;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("min-w-0 rounded-panel border border-line bg-surface p-5 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-h3 font-semibold">
            {title}
          </h2>
          <p className="text-small text-muted">{unit}</p>
        </div>
        {ready ? (
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={asTable}
            onClick={() => {
              setAsTable((current) => !current);
            }}
          >
            {asTable ? <ChartColumn aria-hidden="true" /> : <Table2 aria-hidden="true" />}
            {asTable ? "View as chart" : "View as table"}
          </Button>
        ) : null}
      </div>
      <div className="mt-4">
        {state.isPending ? (
          <div role="status" aria-label={`Loading ${title.toLowerCase()}`}>
            <Skeleton className="h-64" />
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
          <EmptyState icon={ChartColumn} title={emptyTitle} description={emptyDescription} />
        ) : null}
        {ready ? (
          <>
            <p id={summaryId} className="mb-3 text-ink-soft">
              {summary}
            </p>
            {asTable ? (
              table
            ) : (
              <div role="img" aria-labelledby={summaryId} className="h-64">
                {chart}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
