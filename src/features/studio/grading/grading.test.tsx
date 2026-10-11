import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { AttemptReviewRequest, PendingReview } from "@/api/types";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

const pendingItem: PendingReview = {
  attempt_id: 21,
  quiz_id: 2,
  quiz_title: "API fundamentals: checkpoint",
  course_id: 2,
  course_title: "FastAPI in practice",
  student: { id: 5, name: "Andrii", surname: "Kovalenko" },
  submitted_at: "2026-10-11T09:00:00Z",
};

function mockTeacher() {
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
  );
}

function attemptWithOpenAnswer(status = "pending_review", needsReview = true) {
  return {
    id: 21,
    quiz_id: 2,
    quiz_title: "API fundamentals: checkpoint",
    status,
    passing_score: 60,
    started_at: "2026-10-11T08:50:00Z",
    submitted_at: "2026-10-11T09:00:00Z",
    score: null,
    passed: null,
    points_earned: null,
    points_total: null,
    questions: null,
    review: [
      {
        question_id: 33,
        question_text: "Describe dependency injection",
        question_type: "open_text",
        points: 5,
        options: [],
        selected_option_ids: [],
        text_answer: "Dependencies are passed in.",
        correct_option_ids: [],
        is_correct: null,
        points_awarded: needsReview ? null : 4,
        needs_review: needsReview,
        explanation: null,
        teacher_comment: null,
      },
    ],
  };
}

describe("grading queue", () => {
  it("lists attempts waiting for review with a link to each", async () => {
    mockTeacher();
    server.use(http.get(`${API}/reviews/pending`, () => HttpResponse.json([pendingItem])));
    renderApp({ path: "/studio/grading", token: "t" });
    expect(await screen.findByRole("heading", { level: 1, name: "Grading" })).toBeVisible();
    expect(await screen.findByText(/Andrii Kovalenko · FastAPI in practice/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Review answers/ })).toHaveAttribute(
      "href",
      "/studio/grading/21",
    );
  });

  it("explains an empty queue", async () => {
    mockTeacher();
    server.use(http.get(`${API}/reviews/pending`, () => HttpResponse.json([])));
    renderApp({ path: "/studio/grading", token: "t" });
    expect(await screen.findByText("Nothing to grade")).toBeVisible();
  });

  it("shows the API error with a retry", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/reviews/pending`, () =>
        HttpResponse.json({ detail: "Internal server error", request_id: "g1" }, { status: 500 }),
      ),
    );
    renderApp({ path: "/studio/grading", token: "t" });
    expect(await screen.findByText("Could not load the grading queue")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("blocks students", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "student" }))),
    );
    renderApp({ path: "/studio/grading", token: "t" });
    expect(
      await screen.findByRole("heading", { name: "You do not have access to this page" }),
    ).toBeVisible();
  });
});

describe("grading an attempt", () => {
  it("validates the points, saves the grades and returns to the queue", async () => {
    mockTeacher();
    let body: AttemptReviewRequest | null = null;
    server.use(
      http.get(`${API}/reviews/pending`, () => HttpResponse.json([pendingItem])),
      http.get(`${API}/attempts/21`, () => HttpResponse.json(attemptWithOpenAnswer())),
      http.post(`${API}/attempts/21/review`, async ({ request }) => {
        body = (await request.json()) as AttemptReviewRequest;
        return HttpResponse.json(attemptWithOpenAnswer("graded", false));
      }),
    );
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/studio/grading/21", token: "t" });
    expect(await screen.findByText("Dependencies are passed in.")).toBeVisible();
    expect(await screen.findByText(/Andrii Kovalenko/)).toBeVisible();

    await user.type(screen.getByLabelText("Points for answer 1"), "8");
    await user.click(screen.getByRole("button", { name: "Save grades" }));
    expect(await screen.findByText("Enter whole points from 0 to 5")).toBeVisible();
    expect(body).toBeNull();

    await user.clear(screen.getByLabelText("Points for answer 1"));
    await user.type(screen.getByLabelText("Points for answer 1"), "4");
    await user.type(screen.getByLabelText("Comment for answer 1"), "Nice");
    await user.click(screen.getByRole("button", { name: "Save grades" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/studio/grading");
    });
    expect(body).toEqual({ grades: [{ question_id: 33, points: 4, comment: "Nice" }] });
  });

  it("says when nothing is left to grade", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/reviews/pending`, () => HttpResponse.json([])),
      http.get(`${API}/attempts/21`, () =>
        HttpResponse.json(attemptWithOpenAnswer("graded", false)),
      ),
    );
    renderApp({ path: "/studio/grading/21", token: "t" });
    expect(await screen.findByRole("heading", { name: "Already graded" })).toBeVisible();
  });

  it("shows a not found page for an unknown attempt", async () => {
    mockTeacher();
    server.use(
      http.get(`${API}/reviews/pending`, () => HttpResponse.json([])),
      http.get(`${API}/attempts/99`, () =>
        HttpResponse.json({ detail: "Attempt not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: "/studio/grading/99", token: "t" });
    expect(await screen.findByText("Attempt not found")).toBeVisible();
  });
});
