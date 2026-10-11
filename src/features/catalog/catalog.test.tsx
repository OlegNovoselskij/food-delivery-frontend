import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { API_URL, buildCourseListItem } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const COURSES_URL = `${API_URL}/api/v1/courses`;
const CATEGORIES_URL = `${API_URL}/api/v1/categories`;

const CATEGORIES = [
  { id: 1, name: "Programming" },
  { id: 2, name: "Design" },
];

interface Recorder {
  queries: URLSearchParams[];
}

function mockCatalog(total = 2): Recorder {
  const recorder: Recorder = { queries: [] };
  server.use(
    http.get(CATEGORIES_URL, () => HttpResponse.json(CATEGORIES)),
    http.get(COURSES_URL, ({ request }) => {
      recorder.queries.push(new URL(request.url).searchParams);
      return HttpResponse.json({
        items: [
          buildCourseListItem({ id: 1, title: "TypeScript from zero" }),
          buildCourseListItem({ id: 2, title: "PostgreSQL for developers", price: "0.00" }),
        ],
        total,
        page: 1,
        size: 12,
      });
    }),
  );
  return recorder;
}

function lastQuery(recorder: Recorder): URLSearchParams {
  const last = recorder.queries.at(-1);
  if (last === undefined) throw new Error("No catalog request was made");
  return last;
}

describe("catalog", () => {
  it("lists courses with price, teacher and module count", async () => {
    mockCatalog();
    renderApp({ path: "/courses" });
    expect(
      await screen.findByRole("heading", { name: "TypeScript from zero" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$89.00")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getAllByText("3 modules")).toHaveLength(2);
  });

  it("reads the filters from the URL", async () => {
    const recorder = mockCatalog();
    renderApp({ path: "/courses?q=type&category=2&price=paid&sort=price_desc&page=1" });
    await screen.findByRole("heading", { name: "TypeScript from zero" });
    const query = lastQuery(recorder);
    expect(query.get("q")).toBe("type");
    expect(query.get("category_id")).toBe("2");
    expect(query.get("min_price")).toBe("0.01");
    expect(query.get("sort")).toBe("price_desc");
    expect(screen.getByRole("button", { name: "Design" })).toHaveAttribute("aria-pressed", "true");
  });

  it("writes a chosen category to the URL and requests it", async () => {
    const recorder = mockCatalog();
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/courses" });
    await user.click(await screen.findByRole("button", { name: "Design" }));
    await waitFor(() => {
      expect(router.state.location.search).toBe("?category=2");
    });
    await waitFor(() => {
      expect(lastQuery(recorder).get("category_id")).toBe("2");
    });
  });

  it("searches after the user stops typing and resets the page", async () => {
    const recorder = mockCatalog();
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/courses?page=2" });
    await user.type(await screen.findByRole("searchbox", { name: "Search courses" }), "docker");
    await waitFor(() => {
      expect(router.state.location.search).toBe("?q=docker");
    });
    await waitFor(() => {
      expect(lastQuery(recorder).get("q")).toBe("docker");
    });
    expect(lastQuery(recorder).get("page")).toBe("1");
  });

  it("follows the browser back button for filters", async () => {
    mockCatalog();
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/courses" });
    await user.click(await screen.findByRole("button", { name: "Programming" }));
    await waitFor(() => {
      expect(router.state.location.search).toBe("?category=1");
    });
    await router.navigate(-1);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("explains an empty result and clears the filters", async () => {
    server.use(
      http.get(CATEGORIES_URL, () => HttpResponse.json(CATEGORIES)),
      http.get(COURSES_URL, () => HttpResponse.json({ items: [], total: 0, page: 1, size: 12 })),
    );
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/courses?q=zzz" });
    expect(await screen.findByText("No courses match your filters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(router.state.location.search).toBe("");
    });
  });

  it("shows the API error and retries", async () => {
    let calls = 0;
    server.use(
      http.get(CATEGORIES_URL, () => HttpResponse.json(CATEGORIES)),
      http.get(COURSES_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { detail: "Internal server error", request_id: "abc123" },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          items: [buildCourseListItem({ title: "Recovered course" })],
          total: 1,
          page: 1,
          size: 12,
        });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses" });
    expect(await screen.findByText("Could not load courses")).toBeInTheDocument();
    expect(screen.getByText("Request ID: abc123")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Recovered course" })).toBeInTheDocument();
  });

  it("links to the other pages when there are more results", async () => {
    mockCatalog(30);
    renderApp({ path: "/courses?q=a" });
    const next = await screen.findByRole("link", { name: "Page 2" });
    expect(next).toHaveAttribute("href", "/courses?q=a&page=2");
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  });
});
