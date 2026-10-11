import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;
const REPORTS = `${API}/reports/admin`;
const SLOW_FIRST_RENDER_MS = 5000;

afterEach(() => {
  authToken.clear();
});

function mockAdmin(role = "admin") {
  server.use(http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 1, role }))));
}

function mockReports() {
  const requests: URL[] = [];
  const track = (request: Request) => {
    requests.push(new URL(request.url));
  };
  server.use(
    http.get(`${REPORTS}/overview`, () =>
      HttpResponse.json({
        users: { student: 66, teacher: 3 },
        courses: { published: 6, draft: 2 },
        enrollments: { active: 40, completed: 10 },
        revenue: "1223.00",
        refunded: "177.00",
        certificates: 10,
        reviews: 12,
      }),
    ),
    http.get(`${REPORTS}/revenue/breakdown`, ({ request }) => {
      track(request);
      return HttpResponse.json({
        by: "course",
        total_revenue: "882.00",
        items: [
          { id: 2, name: "FastAPI in Practice", revenue: "882.00", refunded: "0", payments: 18 },
        ],
      });
    }),
    http.get(`${REPORTS}/revenue`, ({ request }) => {
      track(request);
      return HttpResponse.json({
        group_by: "month",
        date_from: "2026-09-01",
        date_to: "2026-10-12",
        items: [
          { period: "2026-09-01", revenue: "100.00", refunded: "0", payments: 2 },
          { period: "2026-10-01", revenue: "300.00", refunded: "0", payments: 5 },
        ],
      });
    }),
    http.get(`${REPORTS}/users/growth`, () =>
      HttpResponse.json({
        group_by: "month",
        date_from: "2026-09-01",
        date_to: "2026-10-12",
        items: [{ period: "2026-10-01", students: 4, teachers: 1, total: 5 }],
        totals: { students: 4, teachers: 1, total: 5 },
      }),
    ),
    http.get(`${REPORTS}/teachers`, () =>
      HttpResponse.json({
        items: [
          {
            teacher_id: 3,
            name: "Olena Marchenko",
            courses: 3,
            students: 41,
            completed: 12,
            rating_avg: 4.6,
            reviews_count: 9,
            revenue: "882.00",
          },
        ],
      }),
    ),
    http.get(`${REPORTS}/courses`, () =>
      HttpResponse.json({
        items: [
          {
            course_id: 2,
            title: "FastAPI in Practice",
            status: "published",
            category: "Programming",
            teacher_name: "Olena Marchenko",
            students: 18,
            completed: 3,
            completion_rate: 16.7,
            rating_avg: 4.5,
            reviews_count: 4,
            revenue: "882.00",
          },
        ],
        totals: { students: 18, completed: 3, revenue: "882.00" },
      }),
    ),
  );
  return requests;
}

describe("admin access", () => {
  it("keeps teachers out", async () => {
    mockAdmin("teacher");
    renderApp({ path: "/admin", token: "t" });
    expect(
      await screen.findByRole(
        "heading",
        { name: "You do not have access to this page" },
        { timeout: SLOW_FIRST_RENDER_MS },
      ),
    ).toBeVisible();
  });

  it("shows admins their own navigation", async () => {
    mockAdmin();
    mockReports();
    renderApp({ path: "/admin", token: "t" });
    await screen.findByRole("heading", { level: 1, name: "Platform overview" });
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Categories" })).toHaveAttribute(
      "href",
      "/admin/categories",
    );
  });
});

describe("platform overview", () => {
  it("shows the key numbers and ranking tables", async () => {
    mockAdmin();
    mockReports();
    renderApp({ path: "/admin", token: "t" });
    expect(await screen.findByText("$1,223.00 all time, $177.00 refunded")).toBeVisible();
    expect(screen.getByText("20%")).toBeVisible();
    expect(await screen.findByText("Olena Marchenko")).toBeVisible();
    expect(
      await screen.findByText(
        "$400.00 in total across 2 periods. The best one was Oct 2026 with $300.00.",
      ),
    ).toBeVisible();
    expect(
      await screen.findByText("4 new students and 1 new teacher joined in this period."),
    ).toBeVisible();
  });

  it("offers every chart as a table", async () => {
    mockAdmin();
    mockReports();
    const user = userEvent.setup();
    renderApp({ path: "/admin", token: "t" });
    const section = (await screen.findByRole("heading", { name: "Revenue over time" })).closest(
      "section",
    );
    if (!section) throw new Error("Missing revenue section");
    await user.click(await within(section).findByRole("button", { name: "View as table" }));
    const table = within(section).getByRole("table", { name: "Revenue over time" });
    expect(within(table).getByText("$300.00")).toBeVisible();
    await user.click(within(section).getByRole("button", { name: "View as chart" }));
    expect(within(section).queryByRole("table")).not.toBeInTheDocument();
  });

  it("asks the API again with the new period when the range changes", async () => {
    mockAdmin();
    const requests = mockReports();
    const user = userEvent.setup();
    renderApp({ path: "/admin", token: "t" });
    await screen.findByText("Olena Marchenko");
    await user.click(screen.getByRole("radio", { name: "30 days" }));
    await waitFor(() => {
      expect(requests.some((url) => url.searchParams.get("group_by") === "day")).toBe(true);
    });
    expect(requests.some((url) => url.searchParams.get("group_by") === "month")).toBe(true);
  });

  it("keeps the rest of the page when one section fails", async () => {
    mockAdmin();
    mockReports();
    server.use(
      http.get(`${REPORTS}/users/growth`, () =>
        HttpResponse.json({ detail: "Internal server error", request_id: "u1" }, { status: 500 }),
      ),
    );
    renderApp({ path: "/admin", token: "t" });
    expect(await screen.findByText("Could not load new users")).toBeVisible();
    expect(await screen.findByText("Olena Marchenko")).toBeVisible();
  });

  it("explains an empty revenue period", async () => {
    mockAdmin();
    mockReports();
    server.use(
      http.get(`${REPORTS}/revenue`, () =>
        HttpResponse.json({
          group_by: "month",
          date_from: "2026-09-01",
          date_to: "2026-10-12",
          items: [],
        }),
      ),
    );
    renderApp({ path: "/admin", token: "t" });
    expect(await screen.findByText("No revenue in this period")).toBeVisible();
  });
});

describe("categories", () => {
  it("adds, renames and deletes a category with confirmation", async () => {
    mockAdmin();
    let categories = [{ id: 1, name: "Programming" }];
    const calls: string[] = [];
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json(categories)),
      http.post(`${API}/categories`, async ({ request }) => {
        const body = (await request.json()) as { name: string };
        calls.push(`create ${body.name}`);
        const created = { id: 2, name: body.name };
        categories = [...categories, created];
        return HttpResponse.json(created, { status: 201 });
      }),
      http.patch(`${API}/categories/:id`, async ({ request, params }) => {
        const body = (await request.json()) as { name: string };
        calls.push(`rename ${String(params.id)} ${body.name}`);
        categories = categories.map((c) =>
          c.id === Number(params.id) ? { ...c, name: body.name } : c,
        );
        return HttpResponse.json({ id: Number(params.id), name: body.name });
      }),
      http.delete(`${API}/categories/:id`, ({ params }) => {
        calls.push(`delete ${String(params.id)}`);
        categories = categories.filter((c) => c.id !== Number(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/admin/categories", token: "t" });

    await user.click(await screen.findByRole("button", { name: "Add category" }));
    await user.type(screen.getByLabelText("Category name"), "Design");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    expect(await screen.findByText("Design")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Rename Design" }));
    const input = screen.getByLabelText("Category name");
    await user.clear(input);
    await user.type(input, "UI design");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("UI design")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete UI design" }));
    await user.click(await screen.findByRole("button", { name: "Keep category" }));
    expect(calls).not.toContain("delete 2");
    await user.click(screen.getByRole("button", { name: "Delete UI design" }));
    await user.click(await screen.findByRole("button", { name: "Delete category" }));
    await waitFor(() => {
      expect(screen.queryByText("UI design")).not.toBeInTheDocument();
    });
    expect(calls).toEqual(["create Design", "rename 2 UI design", "delete 2"]);
  });

  it("shows the API message when a category is still in use", async () => {
    mockAdmin();
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json([{ id: 1, name: "Programming" }])),
      http.delete(`${API}/categories/1`, () =>
        HttpResponse.json(
          { detail: "Category has courses and cannot be deleted" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/admin/categories", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Delete Programming" }));
    await user.click(await screen.findByRole("button", { name: "Delete category" }));
    expect(await screen.findByText("Category has courses and cannot be deleted")).toBeVisible();
    expect(screen.getByText("Programming")).toBeVisible();
  });

  it("invites the admin to add the first category", async () => {
    mockAdmin();
    server.use(http.get(`${API}/categories`, () => HttpResponse.json([])));
    renderApp({ path: "/admin/categories", token: "t" });
    expect(await screen.findByText("No categories yet")).toBeVisible();
  });
});
