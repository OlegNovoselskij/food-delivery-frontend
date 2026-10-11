import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RouterProvider } from "react-router";

import { ConfirmProvider } from "@/components/domain/confirm-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth";

import { AuthGate } from "./auth-gate";
import { AppErrorBoundary } from "./error-boundary";
import { createQueryClient } from "./query-client";
import { createAppRouter } from "./router";

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createAppRouter);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConfirmProvider>
            <AuthGate>
              <RouterProvider router={router} />
            </AuthGate>
          </ConfirmProvider>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
