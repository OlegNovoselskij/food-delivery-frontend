import { Navigate, createBrowserRouter, type RouteObject } from "react-router";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { GuestOnly, RequireAuth } from "@/features/auth";

import { AuthLayout } from "./layouts/auth-layout";
import { MainLayout } from "./layouts/main-layout";
import { RootLayout } from "./layouts/root-layout";
import { RouteErrorPage } from "./pages/route-error-page";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            element: <GuestOnly />,
            children: [
              { path: "sign-in", lazy: () => import("@/features/auth/pages/sign-in-page") },
              { path: "sign-up", lazy: () => import("@/features/auth/pages/sign-up-page") },
            ],
          },
          {
            path: "forgot-password",
            lazy: () => import("@/features/auth/pages/forgot-password-page"),
          },
          {
            path: "reset-password",
            lazy: () => import("@/features/auth/pages/reset-password-page"),
          },
        ],
      },
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/courses" replace /> },
          { path: "courses", lazy: () => import("@/features/catalog/pages/catalog-page") },
          { path: "courses/:courseId", lazy: () => import("@/features/course/pages/course-page") },
          {
            path: "certificates/verify/:number",
            lazy: () => import("@/features/certificates/pages/certificate-verify-page"),
          },
          { path: "403", lazy: () => import("./pages/forbidden-page") },
          {
            element: <RequireAuth />,
            children: [
              { path: "profile", lazy: () => import("@/features/profile/pages/profile-page") },
            ],
          },
          { path: "*", lazy: () => import("./pages/not-found-page") },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
