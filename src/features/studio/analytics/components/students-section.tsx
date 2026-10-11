import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { ExportButton } from "@/components/domain/export-button";
import { ProgressTrack } from "@/components/domain/progress-track";
import { ReportTable, Td, Th } from "@/components/domain/report-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelative } from "@/lib/dates";
import { totalPagesFor } from "@/lib/pagination";

import { STUDENTS_PAGE_SIZE, exportReportCsv, studentsQuery } from "../api";
import { inactiveText } from "../format";
import {
  INACTIVE_DAY_OPTIONS,
  NO_STUDENT_FILTERS,
  STUDENT_STATUSES,
  hasStudentFilters,
  parseStudentFilters,
  toStudentSearchParams,
  type StudentFilters,
} from "../student-filters";
import { ReportSection } from "./report-section";

const ANY = "any";
const STATUS_LABELS = { active: "In progress", completed: "Completed" } as const;
const PERCENT = 100;

function statusTone(status: string) {
  return status === "completed" ? "success" : "brand";
}

function statusLabel(status: string): string {
  return status === "active" || status === "completed" ? STATUS_LABELS[status] : status;
}

interface FilterBarProps {
  filters: StudentFilters;
  onChange: (changes: Partial<StudentFilters>) => void;
}

function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="students-status">Status</Label>
        <Select
          value={filters.status ?? ANY}
          onValueChange={(value) => {
            onChange({ status: STUDENT_STATUSES.find((status) => status === value) ?? null });
          }}
        >
          <SelectTrigger id="students-status" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All students</SelectItem>
            {STUDENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="students-inactive">Activity</Label>
        <Select
          value={filters.inactiveDays === null ? ANY : String(filters.inactiveDays)}
          onValueChange={(value) => {
            onChange({
              inactiveDays: INACTIVE_DAY_OPTIONS.find((days) => String(days) === value) ?? null,
            });
          }}
        >
          <SelectTrigger id="students-inactive" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any activity</SelectItem>
            {INACTIVE_DAY_OPTIONS.map((days) => (
              <SelectItem key={days} value={String(days)}>
                Inactive for {days}+ days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasStudentFilters(filters) ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({ status: null, inactiveDays: null });
          }}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function StudentsSection({ courseId }: { courseId: number }) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseStudentFilters(params), [params]);
  const students = useQuery(studentsQuery(courseId, filters));
  const rows = students.data?.items ?? [];
  const filtered = hasStudentFilters(filters);

  const updateFilters = useCallback(
    (changes: Partial<StudentFilters>) => {
      setParams(toStudentSearchParams({ ...filters, page: 1, ...changes }), { replace: true });
    },
    [filters, setParams],
  );

  const hrefForPage = useCallback(
    (page: number) => `?${toStudentSearchParams({ ...filters, page }).toString()}`,
    [filters],
  );

  const totalPages = students.data
    ? totalPagesFor(students.data.total, STUDENTS_PAGE_SIZE)
    : NO_STUDENT_FILTERS.page;

  return (
    <ReportSection
      title="Students"
      description={
        students.data
          ? `${students.data.total} ${students.data.total === 1 ? "student" : "students"} ${filtered ? "match these filters" : "enrolled"}.`
          : "Progress of every enrolled student."
      }
      state={students}
      isEmpty={rows.length === 0 && !filtered}
      emptyIcon={Users}
      emptyTitle="No students yet"
      emptyDescription="Students show up here after they enroll in this course."
      action={
        <ExportButton
          label="Export students CSV"
          run={() => exportReportCsv("students", courseId, filters)}
        />
      }
    >
      <FilterBar filters={filters} onChange={updateFilters} />
      {rows.length === 0 ? (
        <p className="rounded-control bg-sunken px-3 py-3 text-ink-soft">
          No students match these filters. Clear them to see everyone.
        </p>
      ) : (
        <ReportTable label="Students">
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
              <Th>Quizzes passed</Th>
              <Th>Last activity</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollment_id}>
                <Td className="min-w-36">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-small text-muted">
                    Enrolled {formatRelative(row.enrolled_at)}
                  </p>
                </Td>
                <Td>
                  <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                </Td>
                <Td className="min-w-44">
                  <div className="flex items-center gap-3">
                    <ProgressTrack
                      segments={[row.progress_percent / PERCENT]}
                      label={`${row.name} progress`}
                    />
                    <span className="w-10 text-right font-semibold">{row.progress_percent}%</span>
                  </div>
                  <p className="mt-1 text-small text-muted">
                    {row.lessons_completed} of {row.lessons_total} lessons
                  </p>
                </Td>
                <Td>
                  {row.quizzes_passed} of {row.quizzes_total}
                </Td>
                <Td>
                  <p>{formatRelative(row.last_activity_at)}</p>
                  <p className="text-small text-muted">{inactiveText(row.days_inactive)}</p>
                </Td>
              </tr>
            ))}
          </tbody>
        </ReportTable>
      )}
      <Pagination
        page={filters.page}
        totalPages={totalPages}
        hrefFor={hrefForPage}
        className="mt-6"
      />
    </ReportSection>
  );
}
