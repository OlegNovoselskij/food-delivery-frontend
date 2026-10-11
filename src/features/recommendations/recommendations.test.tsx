import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import { API_URL, buildCourseListItem, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;
const SLOW_FIRST_RENDER_MS = 5000;

afterEach(() => {
  authToken.clear();
});

function mockCatalog() {
  server.use(
    http.get(`${API}/categories`, () => HttpResponse.json([{ id: 1, name: "Programming" }])),
    http.get(`${API}/courses`, () =>
      HttpResponse.json({
        items: [buildCourseListItem({ id: 1, title: "Catalog course" })],
        total: 1,
        page: 1,
        size: 12,
      }),
    ),
  );
}

function mockStudent() {
  server.use(http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 5 }))));
}

const recommendation = {
  reason: "Popular right now",
  course: buildCourseListItem({ id: 9, title: "Recommended course" }),
};

describe("recommended courses", () => {
  it("shows each recommendation with its reason on the catalog", async () => {
    mockCatalog();
    mockStudent();
    server.use(http.get(`${API}/recommendations`, () => HttpResponse.json([recommendation])));
    renderApp({ path: "/courses", token: "t" });
    expect(
      await screen.findByText("Popular right now", undefined, { timeout: SLOW_FIRST_RENDER_MS }),
    ).toBeVisible();
    const section = screen.getByRole("region", { name: "Recommended for you" });
    expect(within(section).getByRole("link", { name: "Recommended course" })).toHaveAttribute(
      "href",
      "/courses/9",
    );
  });

  it("is not requested for visitors", async () => {
    mockCatalog();
    let requested = false;
    server.use(
      http.get(`${API}/recommendations`, () => {
        requested = true;
        return HttpResponse.json([recommendation]);
      }),
    );
    renderApp({ path: "/courses" });
    expect(await screen.findByText("Catalog course")).toBeVisible();
    expect(screen.queryByText("Recommended for you")).not.toBeInTheDocument();
    expect(requested).toBe(false);
  });

  it("stays out of the way when filters are active", async () => {
    mockCatalog();
    mockStudent();
    server.use(http.get(`${API}/recommendations`, () => HttpResponse.json([recommendation])));
    renderApp({ path: "/courses?price=free", token: "t" });
    expect(await screen.findByText("Catalog course")).toBeVisible();
    expect(screen.queryByText("Recommended course")).not.toBeInTheDocument();
  });

  it("hides the section when there is nothing to recommend", async () => {
    mockCatalog();
    mockStudent();
    renderApp({ path: "/courses", token: "t" });
    expect(await screen.findByText("Catalog course")).toBeVisible();
    expect(screen.queryByText("Recommended for you")).not.toBeInTheDocument();
  });

  it("explains a failure and retries", async () => {
    mockCatalog();
    mockStudent();
    let calls = 0;
    server.use(
      http.get(`${API}/recommendations`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ detail: "Internal server error" }, { status: 500 })
          : HttpResponse.json([recommendation]);
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    expect(await screen.findByText("Recommendations are not available right now.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Recommended course")).toBeVisible();
  });
});

describe("theme choice", () => {
  it("lets a signed-in user pick a theme from the account menu and remembers it", async () => {
    mockCatalog();
    mockStudent();
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Open account menu" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("atrium.theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(await screen.findByRole("menuitemradio", { name: "Dark" })).toBeChecked();
    await user.click(screen.getByRole("menuitemradio", { name: "System" }));
  });

  it("lets a visitor pick a theme too", async () => {
    mockCatalog();
    const user = userEvent.setup();
    renderApp({ path: "/courses" });
    await user.click(await screen.findByRole("button", { name: "Change theme" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Light" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    window.localStorage.removeItem("atrium.theme");
  });
});
