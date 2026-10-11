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
import { categoriesQuery } from "@/features/catalog";

import {
  COURSE_SORTS,
  DEFAULT_EXPORT_OPTIONS,
  FULL_TABLE_LIMIT,
  adminCoursesQuery,
  exportAdminCsv,
  type CourseSort,
} from "../api";
import { CourseTable } from "../components/course-table";
import { RangeSwitch, useRange } from "../components/range-switch";
import { TableCard } from "../components/table-card";
import { usePeriod } from "../use-period";

const ALL_CATEGORIES = "all";
const SORT_LABELS: Record<CourseSort, string> = {
  students: "Most students",
  completed: "Most completions",
  revenue: "Highest revenue",
  rating: "Best rated",
};

function isCourseSort(value: string): value is CourseSort {
  return COURSE_SORTS.some((sort) => sort === value);
}

export function Component() {
  const { range, setRange } = useRange();
  const period = usePeriod(range);
  const [sort, setSort] = useState<CourseSort>("students");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const categories = useQuery(categoriesQuery());
  const courses = useQuery(adminCoursesQuery(period, sort, categoryId, FULL_TABLE_LIMIT));
  const rows = courses.data?.items ?? [];

  return (
    <div className="container-page flex flex-col gap-6 py-8">
      <title>Courses · Admin · Atrium</title>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Courses</h1>
        <div className="flex flex-wrap items-center gap-3">
          <RangeSwitch range={range} onChange={setRange} />
          <ExportButton
            label="Export CSV"
            run={() =>
              exportAdminCsv("courses", period, {
                ...DEFAULT_EXPORT_OPTIONS,
                courseSort: sort,
                categoryId,
              })
            }
          />
        </div>
      </header>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="course-sort">Sort by</Label>
          <Select
            value={sort}
            onValueChange={(value) => {
              if (isCourseSort(value)) setSort(value);
            }}
          >
            <SelectTrigger id="course-sort" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_SORTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {SORT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="course-category">Category</Label>
          <Select
            value={categoryId === null ? ALL_CATEGORIES : String(categoryId)}
            onValueChange={(value) => {
              const match = categories.data?.find((category) => String(category.id) === value);
              setCategoryId(match?.id ?? null);
            }}
          >
            <SelectTrigger id="course-category" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.data?.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TableCard
        title="All courses"
        state={courses}
        isEmpty={rows.length === 0}
        emptyTitle="No courses match"
        emptyDescription="Try another category or a longer time range."
      >
        <CourseTable rows={rows} detailed />
      </TableCard>
    </div>
  );
}
