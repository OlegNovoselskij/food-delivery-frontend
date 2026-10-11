import type { NavItem } from "@/components/layout/nav-types";
import { ROLES, isRole, type Session } from "@/features/auth";

const PUBLIC_NAV: readonly NavItem[] = [];
const STUDENT_NAV: readonly NavItem[] = [];
const TEACHER_NAV: readonly NavItem[] = [];
const ADMIN_NAV: readonly NavItem[] = [];

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
