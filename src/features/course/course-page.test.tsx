import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import {
  API_URL,
  buildCourse,
  buildEnrollment,
  buildLesson,
  buildModule,
  buildProgram,
  buildReviewPage,
  buildUser,
} from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const COURSE_URL = `${API_URL}/api/v1/courses/1`;

afterEach(() => {
  authToken.clear();
});

interface Scenario {
  user?: ReturnType<typeof buildUser>;
  enrollments?: ReturnType<typeof buildEnrollment>[];
  price?: string;
}

function mockCourse({ user, enrollments = [], price = "89.00" }: Scenario = {}) {
  server.use(
    http.get(COURSE_URL, () => HttpResponse.json(buildCourse({ price }))),
    http.get(`${COURSE_URL}/program`, () =>
      HttpResponse.json(
        buildProgram({
          modules: [
            buildModule({
              has_quiz: true,
              lessons: [
                buildLesson({ id: 101, title: "Why types matter", is_preview: true }),
                buildLesson({ id: 102, title: "Compiler workflow" }),
              ],
            }),
          ],
        }),
      ),
    ),
    http.get(`${COURSE_URL}/reviews`, () => HttpResponse.json(buildReviewPage())),
    http.get(`${API_URL}/api/v1/enrollments/mine`, () => HttpResponse.json(enrollments)),
    http.get(`${API_URL}/api/v1/users/me`, () =>
      user
        ? HttpResponse.json(user)
        : HttpResponse.json({ detail: "Unauthorized" }, { status: 401 }),
    ),
  );
}

describe("course page", () => {
  it("shows the program, price and a sign in call to action to visitors", async () => {
    mockCourse();
    renderApp({ path: "/courses/1" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "TypeScript from zero to production" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Why types matter")).toBeInTheDocument();
    expect(screen.getByText("$89.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enroll in course" })).toHaveAttribute(
      "href",
      "/sign-in?next=%2Fcourses%2F1",
    );
    expect(screen.getByRole("link", { name: "Preview first lessons" })).toHaveAttribute(
      "href",
      "/learning/courses/1/lessons/101",
    );
  });

  it("locks lessons that are not free to preview", async () => {
    mockCourse();
    renderApp({ path: "/courses/1" });
    await screen.findByText("Compiler workflow");
    expect(screen.getByRole("link", { name: /Why types matter/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Compiler workflow/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Locked until you enroll")).toBeInTheDocument();
  });

  it("offers a student who is not enrolled the enroll button", async () => {
    mockCourse({ user: buildUser({ id: 2 }) });
    renderApp({ path: "/courses/1", token: "t" });
    expect(await screen.findByRole("button", { name: "Enroll in course" })).toBeInTheDocument();
  });

  it("calls a free course free to enroll", async () => {
    mockCourse({ user: buildUser({ id: 2 }), price: "0.00" });
    renderApp({ path: "/courses/1", token: "t" });
    expect(await screen.findByRole("button", { name: "Enroll for free" })).toBeInTheDocument();
    expect(screen.getByText("Free, lifetime access")).toBeInTheDocument();
  });

  it("lets an enrolled student continue and opens every lesson", async () => {
    mockCourse({
      user: buildUser({ id: 2 }),
      enrollments: [buildEnrollment({ status: "active" })],
    });
    renderApp({ path: "/courses/1", token: "t" });
    expect(await screen.findByRole("link", { name: "Continue learning" })).toHaveAttribute(
      "href",
      "/learning/courses/1",
    );
    expect(await screen.findByRole("link", { name: /Compiler workflow/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Preview first lessons" })).not.toBeInTheDocument();
  });

  it("shows a pending payment state", async () => {
    mockCourse({
      user: buildUser({ id: 2 }),
      enrollments: [buildEnrollment({ status: "pending_payment" })],
    });
    renderApp({ path: "/courses/1", token: "t" });
    expect(await screen.findByText("Payment pending")).toBeInTheDocument();
  });

  it("sends the owning teacher to the studio", async () => {
    mockCourse({ user: buildUser({ id: 7, role: "teacher" }) });
    renderApp({ path: "/courses/1", token: "t" });
    expect(await screen.findByRole("link", { name: "Edit in studio" })).toHaveAttribute(
      "href",
      "/studio/courses/1",
    );
    expect(screen.queryByRole("button", { name: /Enroll/ })).not.toBeInTheDocument();
  });

  it("renders the reviews tab from the URL", async () => {
    mockCourse();
    renderApp({ path: "/courses/1?tab=reviews" });
    const panel = await screen.findByRole("tabpanel");
    expect(await within(panel).findByText("Maria P.")).toBeInTheDocument();
    expect(within(panel).getByText("Based on 1 review")).toBeInTheDocument();
  });

  it("shows a not found message for unknown courses and bad ids", async () => {
    server.use(
      http.get(COURSE_URL, () =>
        HttpResponse.json({ detail: "Course not found" }, { status: 404 }),
      ),
      http.get(`${COURSE_URL}/program`, () =>
        HttpResponse.json({ detail: "Course not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: "/courses/1" });
    expect(await screen.findByRole("heading", { name: "Course not found" })).toBeInTheDocument();
  });

  it("treats a non numeric id as not found without calling the API", async () => {
    renderApp({ path: "/courses/abc" });
    expect(await screen.findByRole("heading", { name: "Course not found" })).toBeInTheDocument();
  });
});
