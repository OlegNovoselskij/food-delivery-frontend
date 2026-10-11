import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  parseCatalogFilters,
  toCoursesQuery,
  toSearchParams,
} from "./search-params";

function parse(query: string) {
  return parseCatalogFilters(new URLSearchParams(query));
}

describe("parseCatalogFilters", () => {
  it("returns the defaults for an empty query string", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("reads every filter", () => {
    expect(parse("q=docker&category=4&price=paid&sort=price_desc&page=3")).toEqual({
      q: "docker",
      category: 4,
      price: "paid",
      sort: "price_desc",
      page: 3,
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(parse("category=abc&price=cheap&sort=random&page=-2")).toEqual(DEFAULT_FILTERS);
    expect(parse("page=0").page).toBe(1);
    expect(parse("category=0").category).toBeNull();
  });

  it("trims the search text", () => {
    expect(parse("q=%20react%20").q).toBe("react");
  });
});

describe("toSearchParams", () => {
  it("omits defaults so the default catalog has a clean URL", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("round-trips non-default filters", () => {
    const filters = {
      q: "type script",
      category: 2,
      price: "free",
      sort: "price_asc",
      page: 2,
    } as const;
    expect(parse(toSearchParams(filters).toString())).toEqual(filters);
  });
});

describe("toCoursesQuery", () => {
  it("maps free and paid to price bounds", () => {
    expect(toCoursesQuery({ ...DEFAULT_FILTERS, price: "free" }).max_price).toBe("0");
    expect(toCoursesQuery({ ...DEFAULT_FILTERS, price: "paid" }).min_price).toBe("0.01");
    expect(toCoursesQuery(DEFAULT_FILTERS)).toEqual({ sort: "newest", page: 1, size: 12 });
  });

  it("sends the search text and category", () => {
    const query = toCoursesQuery({ ...DEFAULT_FILTERS, q: "sql", category: 3 });
    expect(query.q).toBe("sql");
    expect(query.category_id).toBe(3);
  });
});

describe("hasActiveFilters", () => {
  it("ignores sort and page", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "price_asc", page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, q: "a" })).toBe(true);
  });
});
