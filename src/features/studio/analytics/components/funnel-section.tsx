import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";

import type { FunnelRow } from "@/api/types";
import { ExportButton } from "@/components/domain/export-button";
import { Badge } from "@/components/ui/badge";

import { exportReportCsv, funnelQuery } from "../api";
import { percentText } from "../format";
import { NO_STUDENT_FILTERS } from "../student-filters";
import { ReportSection } from "./report-section";

const PERCENT = 100;

function FunnelBar({ row }: { row: FunnelRow }) {
  const width = Math.min(PERCENT, Math.max(0, row.completed_percent));
  return (
    <li className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{row.title}</p>
        <p className="truncate text-small text-muted">{row.module_title}</p>
      </div>
      <div
        role="progressbar"
        aria-label={`${row.title} completed`}
        aria-valuemin={0}
        aria-valuemax={PERCENT}
        aria-valuenow={Math.round(width)}
        className="h-2.5 overflow-hidden rounded-full bg-line-strong"
      >
        <div
          className={row.biggest_drop ? "h-full bg-warning-ink" : "h-full bg-brand-600"}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex items-center gap-2 sm:w-60 sm:justify-end">
        <span className="font-semibold">{percentText(row.completed_percent)}</span>
        <span className="text-small whitespace-nowrap text-muted">{row.completed} done</span>
        {row.biggest_drop ? <Badge tone="warning">Biggest drop</Badge> : null}
      </div>
    </li>
  );
}

export function FunnelSection({ courseId }: { courseId: number }) {
  const funnel = useQuery(funnelQuery(courseId));
  const rows = funnel.data?.items ?? [];

  return (
    <ReportSection
      title="Lesson funnel"
      description={
        funnel.data
          ? `How many of ${funnel.data.students} enrolled students finished each lesson.`
          : "How many enrolled students finished each lesson."
      }
      state={funnel}
      isEmpty={rows.length === 0}
      emptyIcon={ListChecks}
      emptyTitle="No lessons to report yet"
      emptyDescription="Add lessons to this course and the funnel shows where students stop."
      action={
        <ExportButton
          label="Export funnel CSV"
          disabled={rows.length === 0}
          run={() => exportReportCsv("funnel", courseId, NO_STUDENT_FILTERS)}
        />
      }
    >
      <ol aria-label="Lessons in course order" className="flex flex-col gap-4">
        {rows.map((row) => (
          <FunnelBar key={row.lesson_id} row={row} />
        ))}
      </ol>
    </ReportSection>
  );
}
