import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ExportButton } from "@/components/domain/export-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DEFAULT_EXPORT_OPTIONS,
  FULL_TABLE_LIMIT,
  TEACHER_SORTS,
  exportAdminCsv,
  teachersQuery,
  type TeacherSort,
} from "../api";
import { RangeSwitch, useRange } from "../components/range-switch";
import { TableCard } from "../components/table-card";
import { TeacherTable } from "../components/teacher-table";
import { usePeriod } from "../use-period";

const SORT_LABELS: Record<TeacherSort, string> = {
  rating: "Best rated",
  students: "Most students",
  revenue: "Highest revenue",
  courses: "Most courses",
};

function isTeacherSort(value: string): value is TeacherSort {
  return TEACHER_SORTS.some((sort) => sort === value);
}

export function Component() {
  const { range, setRange } = useRange();
  const period = usePeriod(range);
  const [sort, setSort] = useState<TeacherSort>("rating");
  const teachers = useQuery(teachersQuery(period, sort, FULL_TABLE_LIMIT));
  const rows = teachers.data?.items ?? [];

  return (
    <div className="container-page flex flex-col gap-6 py-8">
      <title>Teachers · Admin · Atrium</title>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Teachers</h1>
        <div className="flex flex-wrap items-center gap-3">
          <RangeSwitch range={range} onChange={setRange} />
          <ExportButton
            label="Export CSV"
            run={() =>
              exportAdminCsv("teachers", period, { ...DEFAULT_EXPORT_OPTIONS, teacherSort: sort })
            }
          />
        </div>
      </header>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="teacher-sort">Sort by</Label>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (isTeacherSort(value)) setSort(value);
          }}
        >
          <SelectTrigger id="teacher-sort" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEACHER_SORTS.map((value) => (
              <SelectItem key={value} value={value}>
                {SORT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TableCard
        title="All teachers"
        state={teachers}
        isEmpty={rows.length === 0}
        emptyTitle="No teachers yet"
        emptyDescription="Teachers appear here once they register."
      >
        <TeacherTable rows={rows} detailed />
      </TableCard>
    </div>
  );
}
