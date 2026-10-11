import { describe, expect, it } from "vitest";

import { parseCourseId } from "./course-id";

describe("parseCourseId", () => {
  it("accepts positive integers", () => {
    expect(parseCourseId("12")).toBe(12);
  });

  it("rejects everything else", () => {
    expect(parseCourseId("0")).toBeNull();
    expect(parseCourseId("-1")).toBeNull();
    expect(parseCourseId("1.5")).toBeNull();
    expect(parseCourseId("abc")).toBeNull();
    expect(parseCourseId(undefined)).toBeNull();
  });
});
