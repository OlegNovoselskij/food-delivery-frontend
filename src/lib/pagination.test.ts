import { describe, expect, it } from "vitest";

import { pageWindow, totalPagesFor } from "./pagination";

describe("totalPagesFor", () => {
  it("rounds up and never returns less than one page", () => {
    expect(totalPagesFor(0, 12)).toBe(1);
    expect(totalPagesFor(12, 12)).toBe(1);
    expect(totalPagesFor(13, 12)).toBe(2);
  });
});

describe("pageWindow", () => {
  it("lists every page when there are few", () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses the far end", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 20]);
  });

  it("collapses both sides around the middle", () => {
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it("collapses the near end", () => {
    expect(pageWindow(20, 20)).toEqual([1, null, 19, 20]);
  });
});
