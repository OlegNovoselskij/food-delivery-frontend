import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";

import { safeNextPath, signInPathFor } from "@/lib/safe-redirect";

import { useAuth } from "./auth-provider";
import { isRole, roleHome, type Role } from "./roles";

export const FORBIDDEN_PATH = "/403";

export function RequireAuth() {
  const { session } = useAuth();
  const { pathname, search } = useLocation();

  if (session.status !== "authenticated") {
    return <Navigate to={signInPathFor(`${pathname}${search}`)} replace />;
  }
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { session } = useAuth();

  if (session.status !== "authenticated") return null;
  const { role } = session.user;
  if (!isRole(role) || !roles.includes(role)) return <Navigate to={FORBIDDEN_PATH} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { session } = useAuth();
  const [params] = useSearchParams();

  if (session.status === "authenticated") {
    const destination = safeNextPath(params.get("next")) ?? roleHome(session.user.role);
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
