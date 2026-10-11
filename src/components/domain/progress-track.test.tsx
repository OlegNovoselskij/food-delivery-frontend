import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressTrack, overallPercent } from "./progress-track";

describe("overallPercent", () => {
  it("averages the segments", () => {
    expect(overallPercent([1, 1, 0, 0])).toBe(50);
  });

  it("clamps values outside the range and handles an empty list", () => {
    expect(overallPercent([2, -1])).toBe(50);
    expect(overallPercent([])).toBe(0);
  });
});

describe("ProgressTrack", () => {
  it("exposes an accessible progressbar", () => {
    render(<ProgressTrack segments={[1, 0.5, 0]} label="Course progress" />);
    const bar = screen.getByRole("progressbar", { name: "Course progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });
});
