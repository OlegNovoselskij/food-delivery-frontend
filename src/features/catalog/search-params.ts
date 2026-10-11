import { z } from "zod";

export const PRICE_FILTERS = ["all", "free", "paid"] as const;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export const CATALOG_PAGE_SIZE = 12;
const SEARCH_MAX_LENGTH = 100;
const PAID_MIN_PRICE = "0.01";
const FREE_MAX_PRICE = "0";

export interface CatalogFilters {
  q: string;
  category: number | null;
  price: PriceFilter;
  sort: SortOption;
  page: number;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: "",
  category: null,
  price: "all",
  sort: "newest",
  page: 1,
};

const filtersSchema = z.object({
  q: z.string().trim().max(SEARCH_MAX_LENGTH).catch(DEFAULT_FILTERS.q),
  category: z.coerce.number().int().positive().nullable().catch(DEFAULT_FILTERS.category),
  price: z.enum(PRICE_FILTERS).catch(DEFAULT_FILTERS.price),
  sort: z.enum(SORT_OPTIONS).catch(DEFAULT_FILTERS.sort),
  page: z.coerce.number().int().min(1).catch(DEFAULT_FILTERS.page),
});

export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  return filtersSchema.parse({
    q: params.get("q") ?? DEFAULT_FILTERS.q,
    category: params.get("category"),
    price: params.get("price") ?? DEFAULT_FILTERS.price,
    sort: params.get("sort") ?? DEFAULT_FILTERS.sort,
    page: params.get("page") ?? DEFAULT_FILTERS.page,
  });
}

export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q !== DEFAULT_FILTERS.q) params.set("q", filters.q);
  if (filters.category !== null) params.set("category", String(filters.category));
  if (filters.price !== DEFAULT_FILTERS.price) params.set("price", filters.price);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page !== DEFAULT_FILTERS.page) params.set("page", String(filters.page));
  return params;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.q !== DEFAULT_FILTERS.q ||
    filters.category !== DEFAULT_FILTERS.category ||
    filters.price !== DEFAULT_FILTERS.price
  );
}

export interface CoursesQuery {
  q?: string;
  category_id?: number;
  min_price?: string;
  max_price?: string;
  sort: SortOption;
  page: number;
  size: number;
}

export function toCoursesQuery(filters: CatalogFilters): CoursesQuery {
  const query: CoursesQuery = {
    sort: filters.sort,
    page: filters.page,
    size: CATALOG_PAGE_SIZE,
  };
  if (filters.q !== "") query.q = filters.q;
  if (filters.category !== null) query.category_id = filters.category;
  if (filters.price === "free") query.max_price = FREE_MAX_PRICE;
  if (filters.price === "paid") query.min_price = PAID_MIN_PRICE;
  return query;
}
