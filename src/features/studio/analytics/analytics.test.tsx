import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { StudentRow } from "@/api/types";
import { API_URL, buildCourse, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;
const REPORTS = `${API}/reports/teacher/courses/4`;
const PATH = "/studio/courses/4/analytics";

afterEach(() => {
  authToken.clear();
});

function student(overrides: Partial<StudentRow> = {}): StudentRow {
  return {
    enrollment_id: 1,
    student_id: 9,
    name: "Andrii Kovalenko",
    status: "active",
    enrolled_at: "2026-10-01T09:00:00Z",
    progress_percent: 40,
    lessons_completed: 2,
    lessons_total: 5,
    quizzes_passed: 1,
    quizzes_total: 2,
    last_activity_at: "2026-10-10T09:00:00Z",
    days_inactive: 2,
    ...overrides,
  };
}

function mockReports(overrides: { students?: StudentRow[]; quizzes?: unknown[] } = {}) {
  const requests: URL[] = [];
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
    http.get(`${API}/courses/4`, () =>
      HttpResponse.json(buildCourse({ id: 4, title: "Testing React", status: "published" })),
    ),
    http.get(`${REPORTS}/funnel`, () =>
      HttpResponse.json({
        course_id: 4,
        students: 12,
        items: [
          {
            lesson_id: 1,
            title: "Intro",
            module_title: "Basics",
            module_position: 1,
            position: 1,
            completed: 10,
            completed_percent: 83,
            drop_off_percent: 0,
            biggest_drop: false,
          },
          {
            lesson_id: 2,
            title: "Hooks",
            module_title: "Basics",
            module_position: 1,
            position: 2,
            completed: 3,
            completed_percent: 25,
            drop_off_percent: 58,
            biggest_drop: true,
          },
        ],
      }),
    ),
    http.get(`${REPORTS}/quizzes`, () =>
      HttpResponse.json({
        course_id: 4,
        items: overrides.quizzes ?? [
          {
            quiz_id: 3,
            title: "Basics check",
            module_title: "Basics",
            passing_score: 60,
            attempts: 9,
            students: 6,
            passed_students: 3,
            pass_rate: 50,
            avg_score: 72.4,
            pending_review: 2,
          },
        ],
      }),
    ),
    http.get(`${REPORTS}/questions`, () =>
      HttpResponse.json({
        course_id: 4,
        items: [
          {
            question_id: 8,
            text: "What does useEffect return?",
            question_type: "single_choice",
            quiz_title: "Basics check",
            answered: 6,
            correct: 1,
            correct_percent: 17,
          },
        ],
      }),
    ),
    http.get(`${REPORTS}/students`, ({ request }) => {
      requests.push(new URL(request.url));
      const items = overrides.students ?? [student()];
      return HttpResponse.json({ course_id: 4, total: items.length, page: 1, size: 10, items });
    }),
  );
  return requests;
}

describe("course analytics", () => {
  it("shows the funnel, quiz results, hardest questions and students", async () => {
    mockReports();
    renderApp({ path: PATH, token: "t" });
    expect(await screen.findByRole("heading", { level: 1, name: "Testing React" })).toBeVisible();

    const funnel = await screen.findByRole("region", { name: "Lesson funnel" });
    expect(await within(funnel).findByText("Biggest drop")).toBeVisible();
    expect(
      within(funnel).getByText("How many of 12 enrolled students finished each lesson."),
    ).toBeVisible();
    expect(within(funnel).getByRole("progressbar", { name: "Hooks completed" })).toHaveAttribute(
      "aria-valuenow",
      "25",
    );

    const quizzes = await screen.findByRole("table", { name: "Quiz results" });
    expect(within(quizzes).getByText("72%")).toBeVisible();
    expect(within(quizzes).getByText("2 waiting")).toBeVisible();

    const questions = await screen.findByRole("table", { name: "Hardest questions" });
    expect(within(questions).getByText("What does useEffect return?")).toBeVisible();

    const students = await screen.findByRole("table", { name: "Students" });
    expect(within(students).getByText("Andrii Kovalenko")).toBeVisible();
    expect(within(students).getByText("2 of 5 lessons")).toBeVisible();
  });

  it("explains a section with no data without hiding the others", async () => {
    mockReports({ quizzes: [], students: [] });
    renderApp({ path: PATH, token: "t" });
    expect(await screen.findByText("No quizzes yet")).toBeVisible();
    expect(await screen.findByText("No students yet")).toBeVisible();
    expect(await screen.findByRole("region", { name: "Lesson funnel" })).toBeVisible();
  });

  it("shows an error with a retry for one section only", async () => {
    mockReports();
    server.use(
      http.get(`${REPORTS}/quizzes`, () =>
        HttpResponse.json({ detail: "Internal server error", request_id: "a1" }, { status: 500 }),
      ),
    );
    renderApp({ path: PATH, token: "t" });
    expect(await screen.findByText("Could not load quiz results")).toBeVisible();
    expect(await screen.findByRole("table", { name: "Students" })).toBeVisible();
  });

  it("filters students through the API and shows a clear message when nobody matches", async () => {
    const requests = mockReports();
    const user = userEvent.setup();
    renderApp({ path: PATH, token: "t" });
    await user.click(await screen.findByRole("combobox", { name: "Status" }));
    server.use(
      http.get(`${REPORTS}/students`, ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ course_id: 4, total: 0, page: 1, size: 10, items: [] });
      }),
    );
    await user.click(await screen.findByRole("option", { name: "Completed" }));
    expect(await screen.findByText(/No students match these filters/)).toBeVisible();
    expect(requests.at(-1)?.searchParams.get("status")).toBe("completed");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("button", { name: "Export students CSV" })).toBeVisible();
  });

  it("shows not found when the course is missing", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
      http.get(`${API}/courses/4`, () =>
        HttpResponse.json({ detail: "Course not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: PATH, token: "t" });
    expect(await screen.findByText("Course not found")).toBeVisible();
  });
});
