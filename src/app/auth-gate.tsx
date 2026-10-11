import type { ReactNode } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/features/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (session.status === "loading") return <PageSkeleton />;

  if (session.status === "failed") {
    return (
      <div className="container-page py-10">
        <ErrorState
          error={session.error}
          onRetry={session.retry}
          title="Could not restore your session"
        />
      </div>
    );
  }

  return children;
}
