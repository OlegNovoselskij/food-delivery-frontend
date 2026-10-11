import type { User } from "@/api/types";

export const API_URL = "http://localhost:8000";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Andrii",
    surname: "Kovalenko",
    email: "andrii@demo.example.com",
    phone: null,
    bio: null,
    role: "student",
    email_verified: true,
    ...overrides,
  };
}
