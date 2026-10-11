import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth";

import { createQueryClient } from "./query-client";
import { routes } from "./router";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("app shell", () => {
  it("renders the landing page on the home route", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Courses taught by people who do the work",
      }),
    ).toBeInTheDocument();
  });

  it("renders the not found page for unknown routes", async () => {
    renderAt("/no/such/page");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to home page" })).toHaveAttribute("href", "/");
  });
});
