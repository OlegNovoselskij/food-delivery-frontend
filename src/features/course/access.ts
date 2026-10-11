import type { Course, Enrollment } from "@/api/types";
import type { Session } from "@/features/auth";
import { ENROLLMENT_STATUS, canLearn, isOpenEnrollment } from "@/features/enrollment";

export type CourseAccess =
  | { kind: "visitor" }
  | { kind: "owner" }
  | { kind: "learning"; enrollment: Enrollment }
  | { kind: "awaiting-payment"; enrollment: Enrollment }
  | { kind: "available" };

interface AccessInput {
  session: Session;
  course: Course;
  enrollment: Enrollment | null | undefined;
}

export function resolveCourseAccess({ session, course, enrollment }: AccessInput): CourseAccess {
  if (session.status !== "authenticated") return { kind: "visitor" };
  if (session.user.id === course.teacher.id) return { kind: "owner" };
  if (enrollment && isOpenEnrollment(enrollment.status)) {
    if (canLearn(enrollment.status)) return { kind: "learning", enrollment };
    if (enrollment.status === ENROLLMENT_STATUS.pendingPayment) {
      return { kind: "awaiting-payment", enrollment };
    }
  }
  return { kind: "available" };
}

export function hasFullAccess(access: CourseAccess): boolean {
  return access.kind === "owner" || access.kind === "learning";
}
