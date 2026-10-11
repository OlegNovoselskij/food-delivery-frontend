import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";

import { authToken } from "@/api/auth-token";
import { AuthGate } from "@/app/auth-gate";
import { routes } from "@/app/router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth";

interface RenderAppOptions {
  path?: string;
  token?: string;
  routeTree?: RouteObject[];
}

export function renderApp({ path = "/", token, routeTree = routes }: RenderAppOptions = {}) {
  if (token !== undefined) authToken.set(token);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routeTree, { initialEntries: [path] });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...view, router, queryClient };
}
