import { describe, expect, it } from "vitest";

import type { Session } from "@/features/auth";
import { buildCourse, buildEnrollment, buildUser } from "@/test/factories";

import { hasFullAccess, resolveCourseAccess } from "./access";

const course = buildCourse();

function signedIn(id: number): Session {
  return { status: "authenticated", user: buildUser({ id }) };
}

describe("resolveCourseAccess", () => {
  it("treats an anonymous visitor as a visitor", () => {
    expect(
      resolveCourseAccess({ session: { status: "anonymous" }, course, enrollment: undefined }),
    ).toEqual({ kind: "visitor" });
  });

  it("recognises the owning teacher before looking at enrollments", () => {
    const access = resolveCourseAccess({
      session: signedIn(course.teacher.id),
      course,
      enrollment: buildEnrollment({ status: "active" }),
    });
    expect(access.kind).toBe("owner");
  });

  it("lets active and completed enrollments learn", () => {
    for (const status of ["active", "completed"]) {
      const access = resolveCourseAccess({
        session: signedIn(1),
        course,
        enrollment: buildEnrollment({ status }),
      });
      expect(access.kind).toBe("learning");
    }
  });

  it("asks for payment while the enrollment is pending", () => {
    const access = resolveCourseAccess({
      session: signedIn(1),
      course,
      enrollment: buildEnrollment({ status: "pending_payment" }),
    });
    expect(access.kind).toBe("awaiting-payment");
  });

  it("offers enrollment again after a cancellation or when there is none", () => {
    const cancelled = buildEnrollment({ status: "cancelled" });
    expect(resolveCourseAccess({ session: signedIn(1), course, enrollment: cancelled }).kind).toBe(
      "available",
    );
    expect(resolveCourseAccess({ session: signedIn(1), course, enrollment: null }).kind).toBe(
      "available",
    );
  });
});

describe("hasFullAccess", () => {
  it("is true for the owner and for learners only", () => {
    expect(hasFullAccess({ kind: "owner" })).toBe(true);
    expect(hasFullAccess({ kind: "visitor" })).toBe(false);
    expect(hasFullAccess({ kind: "available" })).toBe(false);
  });
});
