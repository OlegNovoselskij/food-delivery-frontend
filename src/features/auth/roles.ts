export const ROLES = {
  student: "student",
  teacher: "teacher",
  admin: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ALL_ROLES: readonly string[] = Object.values(ROLES);

export function isRole(value: string): value is Role {
  return ALL_ROLES.includes(value);
}

const ROLE_HOMES: Record<Role, string> = {
  student: "/learning",
  teacher: "/studio",
  admin: "/admin",
};

export function roleHome(role: string): string {
  return isRole(role) ? ROLE_HOMES[role] : ROLE_HOMES.student;
}
