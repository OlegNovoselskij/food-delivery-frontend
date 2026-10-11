import type { NavItem } from "@/components/layout/nav-types";
import { ROLES, isRole, type Session } from "@/features/auth";

const COURSES_NAV: NavItem = { to: "/courses", label: "Courses" };

const PUBLIC_NAV: readonly NavItem[] = [COURSES_NAV];
const STUDENT_NAV: readonly NavItem[] = [
  COURSES_NAV,
  { to: "/learning", label: "My learning", end: false },
  { to: "/certificates", label: "Certificates" },
];
const TEACHER_NAV: readonly NavItem[] = [
  COURSES_NAV,
  { to: "/studio", label: "Teaching", end: true },
  { to: "/studio/grading", label: "Grading", end: false },
];
const ADMIN_NAV: readonly NavItem[] = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/teachers", label: "Teachers" },
  { to: "/admin/categories", label: "Categories" },
];

export function mainNavFor(session: Session): readonly NavItem[] {
  if (session.status !== "authenticated") return PUBLIC_NAV;
  const { role } = session.user;
  if (!isRole(role)) return PUBLIC_NAV;
  switch (role) {
    case ROLES.student:
      return STUDENT_NAV;
    case ROLES.teacher:
      return TEACHER_NAV;
    case ROLES.admin:
      return ADMIN_NAV;
  }
}
