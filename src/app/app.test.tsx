import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth";
import { API_URL } from "@/test/factories";
import { server } from "@/test/server";

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
  it("sends the home route to the catalog", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/categories`, () => HttpResponse.json([])),
      http.get(`${API_URL}/api/v1/courses`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 12 }),
      ),
    );
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
