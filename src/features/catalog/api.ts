import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

import { toCoursesQuery, type CatalogFilters } from "./search-params";

const CATALOG_STALE_TIME_MS = 60_000;
const CATEGORIES_STALE_TIME_MS = 5 * 60_000;

export const catalogKeys = {
  all: ["catalog"] as const,
  categories: ["catalog", "categories"] as const,
  list: (filters: CatalogFilters) => ["catalog", "list", filters] as const,
};

export function categoriesQuery() {
  return queryOptions({
    queryKey: catalogKeys.categories,
    queryFn: () => unwrap(api.GET("/api/v1/categories")),
    staleTime: CATEGORIES_STALE_TIME_MS,
  });
}

export function coursesQuery(filters: CatalogFilters) {
  return queryOptions({
    queryKey: catalogKeys.list(filters),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/courses", { params: { query: toCoursesQuery(filters) }, signal })),
    staleTime: CATALOG_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
