import { describe, expect, it } from "vitest";

import type { Notification } from "@/api/types";

import { notificationTarget } from "./targets";

function notification(type: string, payload: Notification["payload"]): Notification {
  return {
    id: 1,
    type,
    title: "t",
    body: "b",
    payload,
    is_read: false,
    created_at: "2026-03-01T10:00:00Z",
  };
}

describe("notificationTarget", () => {
  it("opens the course after a payment", () => {
    expect(notificationTarget(notification("payment_succeeded", { course_id: 4 }))).toBe(
      "/learning/courses/4",
    );
  });

  it("opens the graded attempt with its course", () => {
    expect(notificationTarget(notification("quiz_graded", { attempt_id: 9, course_id: 4 }))).toBe(
      "/learning/attempts/9?course=4",
    );
  });

  it("opens the certificate when its number is known", () => {
    expect(
      notificationTarget(
        notification("course_completed", { certificate_number: "CERT-2026-AB12CD34" }),
      ),
    ).toBe("/certificates/verify/CERT-2026-AB12CD34");
    expect(notificationTarget(notification("course_completed", {}))).toBe("/certificates");
  });

  it("sends teachers to the grading queue", () => {
    expect(notificationTarget(notification("attempt_pending_review", {}))).toBe("/studio/grading");
  });

  it("has no target for unknown types or missing data", () => {
    expect(notificationTarget(notification("something_new", {}))).toBeNull();
    expect(notificationTarget(notification("payment_succeeded", {}))).toBeNull();
  });
});
