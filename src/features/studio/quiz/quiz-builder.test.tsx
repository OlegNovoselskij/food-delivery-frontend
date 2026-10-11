import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { QuestionInput, QuizManage } from "@/api/types";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;
const QUIZ_PATH = "/studio/courses/5/quizzes/3";

afterEach(() => {
  authToken.clear();
});

function buildQuiz(overrides: Partial<QuizManage> = {}): QuizManage {
  return {
    id: 3,
    module_id: 8,
    title: "Basics check",
    passing_score: 60,
    max_attempts: null,
    has_attempts: false,
    total_points: 3,
    questions: [
      {
        id: 31,
        text: "Which keyword declares a constant?",
        question_type: "single_choice",
        points: 1,
        position: 1,
        explanation: null,
        options: [
          { id: 1, text: "const", is_correct: true },
          { id: 2, text: "var", is_correct: false },
        ],
      },
      {
        id: 32,
        text: "Explain closures",
        question_type: "open_text",
        points: 2,
        position: 2,
        explanation: null,
        options: [],
      },
    ],
    ...overrides,
  };
}

function mockQuiz(initial: QuizManage) {
  const state = { quiz: initial, added: [] as QuestionInput[], deleted: [] as number[] };
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
    http.get(`${API}/quizzes/3/manage`, () => HttpResponse.json(state.quiz)),
    http.post(`${API}/quizzes/3/questions`, async ({ request }) => {
      const body = (await request.json()) as QuestionInput;
      state.added.push(body);
      const id = 100 + state.added.length;
      state.quiz = {
        ...state.quiz,
        questions: [
          ...state.quiz.questions,
          {
            id,
            text: body.text,
            question_type: body.question_type,
            points: body.points,
            position: state.quiz.questions.length + 1,
            explanation: body.explanation ?? null,
            options: (body.options ?? []).map((option, index) => ({
              id: id * 10 + index,
              text: option.text,
              is_correct: option.is_correct,
            })),
          },
        ],
      };
      return HttpResponse.json(state.quiz.questions.at(-1), { status: 201 });
    }),
    http.delete(`${API}/questions/:id`, ({ params }) => {
      const id = Number(params.id);
      state.deleted.push(id);
      state.quiz = { ...state.quiz, questions: state.quiz.questions.filter((q) => q.id !== id) };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return state;
}

describe("quiz builder", () => {
  it("lists the questions with their type, points and correct answers", async () => {
    mockQuiz(buildQuiz());
    renderApp({ path: QUIZ_PATH, token: "t" });
    expect(await screen.findByRole("heading", { level: 1, name: "Basics check" })).toBeVisible();
    expect(screen.getByText("2 questions · 3 points")).toBeVisible();
    const options = screen.getByRole("list", { name: "Options for question 1" });
    expect(within(options).getByText("Correct:")).toBeInTheDocument();
    expect(screen.getByText("Open answer, graded by you")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reorder question 2" })).toBeVisible();
  });

  it("explains an empty quiz and offers the first question", async () => {
    mockQuiz(buildQuiz({ questions: [], total_points: 0 }));
    renderApp({ path: QUIZ_PATH, token: "t" });
    expect(await screen.findByText("No questions yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add question" })).toBeVisible();
  });

  it("shows the API error with a retry when the quiz cannot be loaded", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
      http.get(`${API}/quizzes/3/manage`, () =>
        HttpResponse.json({ detail: "Internal server error", request_id: "q1" }, { status: 500 }),
      ),
    );
    renderApp({ path: QUIZ_PATH, token: "t" });
    expect(await screen.findByText("Could not load this quiz")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("blocks a choice question without a correct option, then adds it", async () => {
    const state = mockQuiz(buildQuiz());
    const user = userEvent.setup();
    renderApp({ path: QUIZ_PATH, token: "t" });
    await user.click(await screen.findByRole("button", { name: "Add question" }));
    const form = screen.getByRole("region", { name: "New question" });

    await user.type(within(form).getByLabelText("Question"), "Which is a loop?");
    await user.type(within(form).getByLabelText("Option 1 text"), "for");
    await user.type(within(form).getByLabelText("Option 2 text"), "if");
    await user.click(within(form).getByRole("button", { name: "Add question" }));
    expect(await within(form).findByText("Mark exactly one option as correct")).toBeVisible();
    expect(state.added).toHaveLength(0);

    await user.click(within(form).getByLabelText("Option 1 is correct"));
    await user.click(within(form).getByRole("button", { name: "Add question" }));

    expect(await screen.findByText("Which is a loop?")).toBeVisible();
    expect(state.added[0]).toEqual({
      text: "Which is a loop?",
      question_type: "single_choice",
      points: 1,
      explanation: null,
      options: [
        { text: "for", is_correct: true },
        { text: "if", is_correct: false },
      ],
    });
  });

  it("hides the options for an open answer question", async () => {
    const state = mockQuiz(buildQuiz());
    const user = userEvent.setup();
    renderApp({ path: QUIZ_PATH, token: "t" });
    await user.click(await screen.findByRole("button", { name: "Add question" }));
    const form = screen.getByRole("region", { name: "New question" });
    await user.type(within(form).getByLabelText("Question"), "Describe hoisting");
    await user.click(within(form).getByRole("radio", { name: /Open answer/ }));
    expect(within(form).queryByLabelText("Option 1 text")).not.toBeInTheDocument();
    await user.click(within(form).getByRole("button", { name: "Add question" }));
    await waitFor(() => {
      expect(state.added[0]).toMatchObject({ question_type: "open_text", options: [] });
    });
  });

  it("deletes a question only after confirmation", async () => {
    const state = mockQuiz(buildQuiz());
    const user = userEvent.setup();
    renderApp({ path: QUIZ_PATH, token: "t" });
    await user.click(await screen.findByRole("button", { name: "Delete question 2" }));
    await user.click(await screen.findByRole("button", { name: "Keep question" }));
    expect(state.deleted).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Delete question 2" }));
    await user.click(await screen.findByRole("button", { name: "Delete question" }));
    await waitFor(() => {
      expect(state.deleted).toEqual([32]);
    });
    await waitFor(() => {
      expect(screen.queryByText("Explain closures")).not.toBeInTheDocument();
    });
  });

  it("locks grading fields once students have taken the quiz", async () => {
    mockQuiz(buildQuiz({ has_attempts: true }));
    const user = userEvent.setup();
    renderApp({ path: QUIZ_PATH, token: "t" });
    expect(await screen.findByText(/Students already took this quiz/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete quiz" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete question 1" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Edit question 1" }));
    expect(screen.getByLabelText("Points")).toBeDisabled();
    expect(screen.getByLabelText("Option 1 is correct")).toBeDisabled();
    expect(screen.getByLabelText("Option 1 text")).toBeEnabled();
  });
});
