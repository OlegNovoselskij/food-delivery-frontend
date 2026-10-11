import type { ApiError } from "@/api/errors";
import type { User } from "@/api/types";

export type Session =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "failed"; error: ApiError; retry: () => void }
  | { status: "authenticated"; user: User };
