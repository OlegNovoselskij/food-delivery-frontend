import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Attempt, AttemptSummary } from "@/api/types";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

const questions: NonNullable<Attempt["questions"]> = [
  {
    id: 1,
    text: "Which keyword declares a constant?",
    question_type: "single_choice",
    points: 1,
    position: 1,
    options: [
      { id: 10, text: "const" },
      { id: 11, text: "var" },
    ],
  },
  {
    id: 2,
    text: "Which are primitive types?",
    question_type: "multiple_choice",
    points: 2,
    position: 2,
    options: [
      { id: 20, text: "string" },
      { id: 21, text: "number" },
      { id: 22, text: "object" },
    ],
  },
  {
    id: 3,
    text: "Why use types?",
    question_type: "open_text",
    points: 3,
    position: 3,
    options: [],
  },
];

function buildAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 70,
    quiz_id: 5,
    quiz_title: "Basics checkpoint",
    status: "in_progress",
    passing_score: 60,
    started_at: "2026-03-01T10:00:00Z",
    submitted_at: null,
    score: null,
    passed: null,
    points_earned: null,
    points_total: null,
    questions,
    review: null,
    ...overrides,
  };
}

function summary(overrides: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    id: 60,
    status: "graded",
    score: 40,
    passed: false,
    points_earned: 2,
    points_total: 5,
    started_at: "2026-02-20T10:00:00Z",
    submitted_at: "2026-02-20T10:10:00Z",
    ...overrides,
  };
}

function mockUser() {
  server.use(http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))));
}

function mockAttempts(attempts: AttemptSummary[]) {
  mockUser();
  server.use(
    http.get(`${API}/quizzes/5/my-attempts`, () => HttpResponse.json(attempts)),
    http.get(`${API}/enrollments/mine`, () => HttpResponse.json([])),
  );
}

describe("quiz intro", () => {
  it("starts a first attempt and shows every question type", async () => {
    mockAttempts([]);
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json(buildAttempt(), { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    expect(await screen.findByText("You have not taken this quiz yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start quiz" }));

    expect(await screen.findByText("Pass mark: 60%")).toBeInTheDocument();
    expect(screen.getByText("0 of 3 answered")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "const" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "string" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your answer")).toBeInTheDocument();
  });

  it("offers a retry after a failed attempt and lists the history", async () => {
    mockAttempts([summary()]);
    renderApp({ path: "/learning/quizzes/5?course=1", token: "t" });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByText("Not passed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View result" })).toHaveAttribute(
      "href",
      "/learning/attempts/60?course=1",
    );
  });

  it("does not offer another attempt after the quiz was passed", async () => {
    mockAttempts([summary({ id: 61, passed: true, score: 90 })]);
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    expect(await screen.findByText(/You passed this quiz with 90%/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start quiz|Try again/ })).not.toBeInTheDocument();
  });

  it("explains a pending review and blocks a new attempt", async () => {
    mockAttempts([summary({ status: "pending_review", passed: null, score: null })]);
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    expect(await screen.findByText(/teacher still has to grade/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start quiz|Try again/ })).not.toBeInTheDocument();
  });

  it("continues an open attempt", async () => {
    mockAttempts([summary({ status: "in_progress", passed: null, score: null })]);
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    expect(await screen.findByRole("button", { name: "Continue quiz" })).toBeInTheDocument();
  });

  it("shows the server message when no attempts are left", async () => {
    mockAttempts([summary()]);
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json({ detail: "No attempts left for this quiz" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No attempts left for this quiz")).toBeInTheDocument();
  });
});

describe("taking a quiz", () => {
  const failed = buildAttempt({
    status: "graded",
    score: 0,
    passed: false,
    points_earned: 0,
    points_total: 6,
    questions: null,
    review: [],
  });
  const passedResult = buildAttempt({
    status: "graded",
    score: 100,
    passed: true,
    points_earned: 6,
    points_total: 6,
    questions: null,
    review: [],
  });

  function startQuiz(result: Attempt = passedResult) {
    mockAttempts([]);
    server.use(http.get(`${API}/attempts/70`, () => HttpResponse.json(result)));
    const user = userEvent.setup();
    return {
      user,
      startFlow: async () => {
        renderApp({ path: "/learning/quizzes/5?course=1", token: "t" });
        await user.click(await screen.findByRole("button", { name: "Start quiz" }));
        await screen.findByText("0 of 3 answered");
      },
    };
  }

  it("submits the answers in the API shape and opens the result", async () => {
    const { user, startFlow } = startQuiz();
    let body: unknown = null;
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json(buildAttempt(), { status: 201 }),
      ),
      http.post(`${API}/attempts/70/submit`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          buildAttempt({
            status: "graded",
            score: 100,
            passed: true,
            points_earned: 6,
            points_total: 6,
            questions: null,
            review: [],
          }),
        );
      }),
    );
    await startFlow();
    await user.click(screen.getByRole("radio", { name: "const" }));
    await user.click(screen.getByRole("checkbox", { name: "string" }));
    await user.click(screen.getByRole("checkbox", { name: "number" }));
    await user.type(screen.getByLabelText("Your answer"), "Types catch mistakes.");
    expect(screen.getByText("3 of 3 answered")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit quiz" }));

    expect(await screen.findByRole("heading", { name: "You passed" })).toBeInTheDocument();
    expect(body).toEqual({
      answers: [
        { question_id: 1, option_ids: [10] },
        { question_id: 2, option_ids: [20, 21] },
        { question_id: 3, option_ids: [], text: "Types catch mistakes." },
      ],
    });
  });

  it("asks before submitting with unanswered questions", async () => {
    const { user, startFlow } = startQuiz(failed);
    let submitted = 0;
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json(buildAttempt(), { status: 201 }),
      ),
      http.post(`${API}/attempts/70/submit`, () => {
        submitted += 1;
        return HttpResponse.json(
          buildAttempt({
            status: "graded",
            score: 0,
            passed: false,
            points_earned: 0,
            points_total: 6,
            questions: null,
            review: [],
          }),
        );
      }),
    );
    await startFlow();
    await user.click(screen.getByRole("button", { name: "Submit quiz" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Submit with unanswered questions?",
    });
    expect(within(dialog).getByText(/3 questions unanswered/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Keep working" }));
    expect(submitted).toBe(0);

    await user.click(screen.getByRole("button", { name: "Submit quiz" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Submit quiz" }),
    );
    expect(await screen.findByRole("heading", { name: "Not passed yet" })).toBeInTheDocument();
    expect(submitted).toBe(1);
  });

  it("submits only once even when the button is clicked repeatedly", async () => {
    const { user, startFlow } = startQuiz(failed);
    let submitted = 0;
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json(buildAttempt(), { status: 201 }),
      ),
      http.post(`${API}/attempts/70/submit`, async () => {
        submitted += 1;
        await new Promise((resolve) => setTimeout(resolve, 150));
        return HttpResponse.json(
          buildAttempt({
            status: "graded",
            score: 50,
            passed: false,
            points_earned: 3,
            points_total: 6,
            questions: null,
            review: [],
          }),
        );
      }),
    );
    await startFlow();
    await user.click(screen.getByRole("radio", { name: "const" }));
    await user.click(screen.getByRole("checkbox", { name: "string" }));
    await user.type(screen.getByLabelText("Your answer"), "x");
    const button = screen.getByRole("button", { name: "Submit quiz" });
    await user.dblClick(button);
    await screen.findByRole("heading", { name: "Not passed yet" });
    expect(submitted).toBe(1);
  });

  it("restores a saved draft for the same attempt", async () => {
    window.localStorage.setItem(
      "atrium.quiz-draft.70",
      JSON.stringify({ 1: { optionIds: [11], text: "" } }),
    );
    mockAttempts([]);
    server.use(
      http.post(`${API}/quizzes/5/attempts`, () =>
        HttpResponse.json(buildAttempt(), { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/quizzes/5", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Start quiz" }));
    expect(await screen.findByText("1 of 3 answered")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "var" })).toBeChecked();
  });
});

describe("attempt result", () => {
  const review = [
    {
      question_id: 1,
      question_text: "Which keyword declares a constant?",
      question_type: "single_choice",
      points: 1,
      options: [
        { id: 10, text: "const" },
        { id: 11, text: "var" },
      ],
      selected_option_ids: [11],
      text_answer: null,
      correct_option_ids: [10],
      is_correct: false,
      points_awarded: 0,
      needs_review: false,
      explanation: "const cannot be reassigned.",
      teacher_comment: null,
    },
    {
      question_id: 3,
      question_text: "Why use types?",
      question_type: "open_text",
      points: 3,
      options: [],
      selected_option_ids: [],
      text_answer: "Types catch mistakes.",
      correct_option_ids: [],
      is_correct: null,
      points_awarded: null,
      needs_review: true,
      explanation: null,
      teacher_comment: null,
    },
  ];

  it("explains a failed attempt with your answer, the correct one and the explanation", async () => {
    mockUser();
    server.use(
      http.get(`${API}/attempts/70`, () =>
        HttpResponse.json(
          buildAttempt({
            status: "graded",
            score: 20,
            passed: false,
            points_earned: 1,
            points_total: 5,
            questions: null,
            review,
          }),
        ),
      ),
    );
    renderApp({ path: "/learning/attempts/70?course=1", token: "t" });
    expect(await screen.findByRole("heading", { name: "Not passed yet" })).toBeInTheDocument();
    expect(
      screen.getByText(/You scored 20% with 1 of 5 points. The pass mark is 60%./),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Score 20 percent, not passed" })).toBeInTheDocument();
    expect(screen.getAllByText("Your answer").length).toBeGreaterThan(0);
    expect(screen.getByText("Correct answer")).toBeInTheDocument();
    expect(screen.getByText("const cannot be reassigned.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      "/learning/quizzes/5?course=1",
    );
    expect(screen.getByRole("link", { name: "Continue course" })).toHaveAttribute(
      "href",
      "/learning/courses/1",
    );
  });

  it("shows a waiting state for written answers", async () => {
    mockUser();
    server.use(
      http.get(`${API}/attempts/70`, () =>
        HttpResponse.json(
          buildAttempt({ status: "pending_review", questions: null, review, points_total: 5 }),
        ),
      ),
    );
    renderApp({ path: "/learning/attempts/70", token: "t" });
    expect(
      await screen.findByRole("heading", { name: "Waiting for your teacher" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("reports an attempt that is not yours as not found", async () => {
    mockUser();
    server.use(
      http.get(`${API}/attempts/70`, () =>
        HttpResponse.json({ detail: "Attempt not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: "/learning/attempts/70", token: "t" });
    expect(await screen.findByRole("heading", { name: "Result not found" })).toBeInTheDocument();
  });

  it("waits for the result without leaking a blank page", async () => {
    mockUser();
    server.use(
      http.get(`${API}/attempts/70`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(
          buildAttempt({
            status: "graded",
            score: 80,
            passed: true,
            points_earned: 4,
            points_total: 5,
            questions: null,
            review: [],
          }),
        );
      }),
    );
    renderApp({ path: "/learning/attempts/70", token: "t" });
    expect(await screen.findByRole("status", { name: "Loading result" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "You passed" })).toBeInTheDocument();
    });
  });
});
