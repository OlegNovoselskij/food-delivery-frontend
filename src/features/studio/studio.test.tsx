import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { CourseStatRow } from "@/api/types";
import { API_URL, buildCourse, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

function mockTeacher(role = "teacher") {
  server.use(http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role }))));
}

function statRow(courseId: number, overrides: Partial<CourseStatRow> = {}): CourseStatRow {
  return {
    course_id: courseId,
    title: "x",
    status: "published",
    category: "Programming",
    teacher_name: "Olena M",
    students: 12,
    completed: 5,
    completion_rate: 41,
    rating_avg: 4.5,
    reviews_count: 4,
    revenue: "300.00",
    ...overrides,
  };
}

describe("studio access", () => {
  it("sends visitors to sign in", async () => {
    renderApp({ path: "/studio" });
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
  });

  it("blocks students with the no access page", async () => {
    mockTeacher("student");
    renderApp({ path: "/studio", token: "t" });
    expect(
      await screen.findByRole("heading", { name: "You do not have access to this page" }),
    ).toBeInTheDocument();
  });

  it("shows teachers a Teaching link in the navigation", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/courses/mine`, () => HttpResponse.json([])),
      http.get(`${API}/reports/teacher/dashboard`, () =>
        HttpResponse.json({ items: [], totals: { students: 0, completed: 0, revenue: "0" } }),
      ),
    );
    renderApp({ path: "/studio", token: "t" });
    expect(await screen.findByRole("heading", { level: 1, name: "Teaching" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Teaching" }).length).toBeGreaterThan(0);
  });
});

describe("studio dashboard", () => {
  it("shows KPIs and the teacher's courses with their status", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/courses/mine`, () =>
        HttpResponse.json([
          buildCourse({ id: 1, title: "Alpha course", status: "published" }),
          buildCourse({ id: 2, title: "Beta course", status: "draft", rating_avg: null }),
        ]),
      ),
      http.get(`${API}/reports/teacher/dashboard`, () =>
        HttpResponse.json({
          items: [statRow(1)],
          totals: { students: 12, completed: 5, revenue: "300.00" },
        }),
      ),
    );
    renderApp({ path: "/studio", token: "t" });
    expect(await screen.findByText("1 of 2 published")).toBeInTheDocument();
    expect(screen.getByText("$300.00", { selector: "p" })).toBeInTheDocument();
    const published = screen.getByRole("heading", { name: "Alpha course" }).closest("article");
    const draft = screen.getByRole("heading", { name: "Beta course" }).closest("article");
    if (!published || !draft) throw new Error("Missing course rows");
    expect(within(published).getByText("Published")).toBeInTheDocument();
    expect(within(draft).getByText("Draft")).toBeInTheDocument();
    expect(within(published).getByRole("link", { name: "Analytics" })).toHaveAttribute(
      "href",
      "/studio/courses/1/analytics",
    );
  });

  it("invites a new teacher to create the first course", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/courses/mine`, () => HttpResponse.json([])),
      http.get(`${API}/reports/teacher/dashboard`, () =>
        HttpResponse.json({ items: [], totals: { students: 0, completed: 0, revenue: "0" } }),
      ),
    );
    renderApp({ path: "/studio", token: "t" });
    expect(await screen.findByText("You have not created a course yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a course" })).toHaveAttribute(
      "href",
      "/studio/courses/new",
    );
  });

  it("shows the API error with a retry", async () => {
    mockTeacher();
    let calls = 0;
    server.use(
      http.get(`${API}/courses/mine`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { detail: "Internal server error", request_id: "r1" },
              { status: 500 },
            )
          : HttpResponse.json([]);
      }),
      http.get(`${API}/reports/teacher/dashboard`, () =>
        HttpResponse.json({ items: [], totals: { students: 0, completed: 0, revenue: "0" } }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio", token: "t" });
    expect(await screen.findByText("Could not load your courses")).toBeInTheDocument();
    expect(screen.getByText("Request ID: r1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("You have not created a course yet")).toBeInTheDocument();
  });
});

describe("create course", () => {
  it("validates the form and creates a course, then opens the builder", async () => {
    mockTeacher();
    let body: unknown = null;
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json([{ id: 1, name: "Programming" }])),
      http.post(`${API}/courses`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildCourse({ id: 42, status: "draft" }), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/studio/courses/new", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Create course" }));
    expect(await screen.findByText("Use at least 3 characters")).toBeInTheDocument();
    expect(
      screen.getAllByRole("alert").some((alert) => alert.textContent === "Choose a category"),
    ).toBe(true);

    await user.type(screen.getByLabelText("Title"), "Testing React");
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Programming" }));
    await user.clear(screen.getByLabelText("Price in USD"));
    await user.type(screen.getByLabelText("Price in USD"), "59");
    await user.click(screen.getByRole("button", { name: "Create course" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/studio/courses/42");
    });
    expect(body).toMatchObject({
      title: "Testing React",
      category_id: 1,
      level: "beginner",
      price: "59",
      description: null,
      cover_url: null,
    });
  });

  it("maps a server validation error onto the field", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json([{ id: 1, name: "Programming" }])),
      http.post(`${API}/courses`, () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ["body", "title"],
                msg: "String should have at most 200 characters",
                type: "x",
              },
            ],
          },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/new", token: "t" });
    await user.type(await screen.findByLabelText("Title"), "Testing React");
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Programming" }));
    await user.click(screen.getByRole("button", { name: "Create course" }));
    expect(
      await screen.findByText("String should have at most 200 characters"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
  });
});
