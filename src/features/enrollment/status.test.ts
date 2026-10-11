import { describe, expect, it } from "vitest";

import { canCancel, canLearn, isEnrollmentStatus, isOpenEnrollment } from "./status";

describe("enrollment status rules", () => {
  it("allows learning only when the enrollment is active or completed", () => {
    expect(canLearn("active")).toBe(true);
    expect(canLearn("completed")).toBe(true);
    expect(canLearn("pending_payment")).toBe(false);
    expect(canLearn("cancelled")).toBe(false);
  });

  it("allows cancelling only before completion", () => {
    expect(canCancel("pending_payment")).toBe(true);
    expect(canCancel("active")).toBe(true);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
  });

  it("treats a cancelled enrollment as closed", () => {
    expect(isOpenEnrollment("cancelled")).toBe(false);
    expect(isOpenEnrollment("active")).toBe(true);
  });

  it("recognises backend values only", () => {
    expect(isEnrollmentStatus("active")).toBe(true);
    expect(isEnrollmentStatus("paused")).toBe(false);
  });
});
