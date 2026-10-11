import { describe, expect, it } from "vitest";

import { inactiveText, percentText } from "./format";
import {
  NO_STUDENT_FILTERS,
  hasStudentFilters,
  parseStudentFilters,
  toStudentSearchParams,
} from "./student-filters";

describe("parseStudentFilters", () => {
  it("uses defaults for an empty address", () => {
    expect(parseStudentFilters(new URLSearchParams())).toEqual(NO_STUDENT_FILTERS);
  });

  it("reads valid values", () => {
    const params = new URLSearchParams("page=3&status=completed&inactive=14");
    expect(parseStudentFilters(params)).toEqual({ page: 3, status: "completed", inactiveDays: 14 });
  });

  it("falls back for values the API would reject", () => {
    const params = new URLSearchParams("page=-2&status=banned&inactive=5");
    expect(parseStudentFilters(params)).toEqual(NO_STUDENT_FILTERS);
  });
});

describe("toStudentSearchParams", () => {
  it("omits defaults and round-trips the rest", () => {
    expect(toStudentSearchParams(NO_STUDENT_FILTERS).toString()).toBe("");
    const filters = { page: 2, status: "active", inactiveDays: 30 } as const;
    expect(parseStudentFilters(toStudentSearchParams(filters))).toEqual(filters);
  });

  it("knows when a filter is on", () => {
    expect(hasStudentFilters(NO_STUDENT_FILTERS)).toBe(false);
    expect(hasStudentFilters({ ...NO_STUDENT_FILTERS, status: "active" })).toBe(true);
    expect(hasStudentFilters({ ...NO_STUDENT_FILTERS, page: 4 })).toBe(false);
  });
});

describe("report formatting", () => {
  it("rounds percents and marks missing data", () => {
    expect(percentText(33.4)).toBe("33%");
    expect(percentText(null)).toBe("No data");
  });

  it("describes inactivity", () => {
    expect(inactiveText(0)).toBe("Today");
    expect(inactiveText(1)).toBe("1 day ago");
    expect(inactiveText(9)).toBe("9 days ago");
  });
});
