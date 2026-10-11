import { describe, expect, it } from "vitest";

import { formatDate, formatDuration } from "./dates";

describe("formatDate", () => {
  it("formats an ISO date for display", () => {
    expect(formatDate("2026-03-05T10:00:00Z")).toMatch(/^Mar [45], 2026$/);
  });
});

describe("formatDuration", () => {
  it("shows minutes and hides unknown or zero durations", () => {
    expect(formatDuration(12)).toBe("12 min");
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(null)).toBe("");
  });
});
