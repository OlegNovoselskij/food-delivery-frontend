import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { authToken } from "@/api/auth-token";
import { toApiError } from "@/api/errors";

import { currentUserQuery } from "./api";
import type { Session } from "./session";

interface AuthContextValue {
  session: Session;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useStoredToken(): string | null {
  return useSyncExternalStore(authToken.subscribe, authToken.get);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useStoredToken();
  const queryClient = useQueryClient();
  const query = useQuery(currentUserQuery(token !== null));
  const { refetch } = query;

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const signOut = useCallback(() => {
    authToken.clear();
    queryClient.clear();
  }, [queryClient]);

  const session = useMemo<Session>(() => {
    if (token === null) return { status: "anonymous" };
    if (query.data) return { status: "authenticated", user: query.data };
    if (query.isError) return { status: "failed", error: toApiError(query.error), retry };
    return { status: "loading" };
  }, [token, query.data, query.isError, query.error, retry]);

  const value = useMemo(() => ({ session, signOut }), [session, signOut]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
