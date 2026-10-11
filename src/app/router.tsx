import { Navigate, createBrowserRouter, type RouteObject } from "react-router";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { GuestOnly, RequireAuth, RequireRole } from "@/features/auth";

import { AuthLayout } from "./layouts/auth-layout";
import { MainLayout } from "./layouts/main-layout";
import { PlayerLayout } from "./layouts/player-layout";
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
        element: <PlayerLayout />,
        children: [
          {
            path: "learning/courses/:courseId/lessons/:lessonId",
            lazy: () => import("@/features/learning/pages/lesson-player-page"),
          },
          {
            element: <RequireAuth />,
            children: [
              {
                path: "learning/courses/:courseId",
                lazy: () => import("@/features/learning/pages/course-entry-page"),
              },
            ],
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
              { path: "learning", lazy: () => import("@/features/learning/pages/learning-page") },
              {
                path: "certificates",
                lazy: () => import("@/features/certificates/pages/certificates-page"),
              },
              {
                path: "notifications",
                lazy: () => import("@/features/notifications/pages/notifications-page"),
              },
              {
                path: "learning/quizzes/:quizId",
                lazy: () => import("@/features/quiz/pages/quiz-page"),
              },
              {
                path: "learning/attempts/:attemptId",
                lazy: () => import("@/features/quiz/pages/attempt-result-page"),
              },
              {
                element: <RequireRole roles={["teacher"]} />,
                children: [
                  {
                    path: "studio",
                    lazy: () => import("@/features/studio/pages/studio-dashboard-page"),
                  },
                  {
                    path: "studio/courses/new",
                    lazy: () => import("@/features/studio/pages/course-create-page"),
                  },
                ],
              },
              {
                element: <RequireRole roles={["teacher", "admin"]} />,
                children: [
                  {
                    path: "studio/courses/:courseId",
                    lazy: () => import("@/features/studio/pages/course-builder-page"),
                  },
                  {
                    path: "studio/courses/:courseId/lessons/:lessonId",
                    lazy: () => import("@/features/studio/pages/course-builder-page"),
                  },
                  {
                    path: "studio/courses/:courseId/quizzes/:quizId",
                    lazy: () => import("@/features/studio/pages/quiz-builder-page"),
                  },
                ],
              },
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
