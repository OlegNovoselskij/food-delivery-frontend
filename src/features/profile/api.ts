import { api } from "@/api/client";
import type { UserUpdate } from "@/api/types";
import { unwrap } from "@/api/unwrap";

export function updateProfile(body: UserUpdate) {
  return unwrap(api.PATCH("/api/v1/users/me", { body }));
}
