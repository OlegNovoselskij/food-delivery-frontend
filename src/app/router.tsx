import { createBrowserRouter, type RouteObject } from "react-router";

import { PageSkeleton } from "@/components/feedback/page-skeleton";

import { PublicLayout } from "./layouts/public-layout";
import { RootLayout } from "./layouts/root-layout";
import { RouteErrorPage } from "./pages/route-error-page";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, lazy: () => import("@/features/landing/pages/landing-page") },
          { path: "*", lazy: () => import("./pages/not-found-page") },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
