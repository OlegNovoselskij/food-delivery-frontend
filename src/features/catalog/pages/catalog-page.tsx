import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { ErrorState } from "@/components/feedback/error-state";
import { Pagination } from "@/components/ui/pagination";
import { usePrefetchCourse } from "@/features/course";
import { totalPagesFor } from "@/lib/pagination";

import { categoriesQuery, coursesQuery } from "../api";
import { CatalogFilterBar } from "../components/catalog-filters";
import { CatalogSearch } from "../components/catalog-search";
import { CourseGrid, CourseGridSkeleton } from "../components/course-grid";
import {
  CATALOG_PAGE_SIZE,
  DEFAULT_FILTERS,
  hasActiveFilters,
  parseCatalogFilters,
  toSearchParams,
  type CatalogFilters,
} from "../search-params";

export function Component() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseCatalogFilters(params), [params]);
  const prefetchCourse = usePrefetchCourse();
  const courses = useQuery(coursesQuery(filters));
  const categories = useQuery(categoriesQuery());

  const updateFilters = useCallback(
    (changes: Partial<CatalogFilters>) => {
      const next: CatalogFilters = { ...filters, page: 1, ...changes };
      setParams(toSearchParams(next));
    },
    [filters, setParams],
  );

  const search = useCallback(
    (q: string) => {
      updateFilters({ q });
    },
    [updateFilters],
  );

  const hrefForPage = useCallback(
    (page: number) => {
      const query = toSearchParams({ ...filters, page }).toString();
      return query === "" ? "/courses" : `/courses?${query}`;
    },
    [filters],
  );

  const totalPages = courses.data ? totalPagesFor(courses.data.total, CATALOG_PAGE_SIZE) : 1;

  return (
    <div className="container-page py-10">
      <title>Courses · Atrium</title>
      <section className="pb-8">
        <h1 className="max-w-3xl text-display font-bold">
          Courses taught by people who do the work
        </h1>
        <p className="mt-4 max-w-xl text-h3 font-normal text-muted">
          Pick a topic, follow the program module by module, and earn a certificate you can verify
          online.
        </p>
        <div className="mt-8">
          <CatalogSearch value={filters.q} onSearch={search} />
        </div>
      </section>

      <CatalogFilterBar
        filters={filters}
        categories={categories.data ?? []}
        onChange={updateFilters}
      />

      <div className="pt-8" aria-live="polite">
        {courses.isPending ? <CourseGridSkeleton /> : null}
        {courses.isError ? (
          <ErrorState
            error={courses.error}
            title="Could not load courses"
            onRetry={() => {
              void courses.refetch();
            }}
          />
        ) : null}
        {courses.data ? (
          <CourseGrid
            courses={courses.data.items}
            filtersActive={hasActiveFilters(filters)}
            onClearFilters={() => {
              setParams(toSearchParams({ ...DEFAULT_FILTERS, sort: filters.sort }));
            }}
            onPrefetch={prefetchCourse}
          />
        ) : null}
      </div>

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        hrefFor={hrefForPage}
        className="mt-10"
      />
    </div>
  );
}
