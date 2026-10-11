import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Lesson } from "@/api/types";
import {
  API_URL,
  buildCourse,
  buildLesson,
  buildModule,
  buildProgram,
  buildUser,
} from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

afterEach(() => {
  authToken.clear();
});

function lessonDetail(overrides: Partial<Lesson> = {}): Lesson {
  return {
    ...buildLesson({ id: 101, title: "Why types matter", has_video: false }),
    module_id: 51,
    content: "Types describe data.",
    materials: [],
    ...overrides,
  };
}

const program = buildProgram({
  modules: [
    buildModule({
      id: 51,
      title: "Getting set up",
      has_quiz: true,
      quiz_id: 9,
      quiz_questions_count: 4,
      lessons: [
        buildLesson({ id: 101, title: "Why types matter", has_video: true, is_preview: true }),
        buildLesson({ id: 102, title: "Compiler workflow", has_video: false }),
        buildLesson({ id: 103, title: "Reading notes", lesson_type: "article", has_video: false }),
      ],
    }),
  ],
});

interface BuilderState {
  program: typeof program;
}

function mockBuilder(options: { status?: string } = {}): BuilderState {
  const state: BuilderState = { program };
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
    http.get(`${API}/courses/1`, () =>
      HttpResponse.json(buildCourse({ status: options.status ?? "draft" })),
    ),
    http.get(`${API}/courses/1/program`, () => HttpResponse.json(state.program)),
    http.get(`${API}/lessons/101`, () => HttpResponse.json(lessonDetail())),
  );
  return state;
}

describe("course builder", () => {
  it("shows modules, lesson statuses and the quiz of a module", async () => {
    mockBuilder();
    renderApp({ path: "/studio/courses/1", token: "t" });
    expect(await screen.findByRole("heading", { name: "1. Getting set up" })).toBeInTheDocument();
    expect(screen.getByText("4 items")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Lessons in Getting set up" });
    expect(within(list).getByText("Video ready")).toBeInTheDocument();
    expect(within(list).getByText("No video")).toBeInTheDocument();
    expect(within(list).getByText("Article")).toBeInTheDocument();
    expect(within(list).getByText("Free preview")).toBeInTheDocument();
    expect(within(list).getByText("Quiz · 4 questions")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("offers the actions that fit the course status", async () => {
    mockBuilder({ status: "published" });
    renderApp({ path: "/studio/courses/1", token: "t" });
    expect(await screen.findByRole("button", { name: "Archive course" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish course" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
  });

  it("shows the API reason when publishing is rejected", async () => {
    mockBuilder();
    server.use(
      http.post(`${API}/courses/1/publish`, () =>
        HttpResponse.json({ detail: "Add at least one lesson before publishing" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Publish course" }));
    expect(
      await screen.findByText("Course not published. Add at least one lesson before publishing"),
    ).toBeInTheDocument();
  });

  it("adds a module and shows it at once", async () => {
    const state = mockBuilder();
    let body: unknown = null;
    server.use(
      http.post(`${API}/courses/1/modules`, async ({ request }) => {
        body = await request.json();
        const created = buildModule({ id: 60, title: "Advanced", position: 2, lessons: [] });
        state.program = { ...state.program, modules: [...state.program.modules, created] };
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Add module" }));
    await user.type(screen.getByRole("textbox", { name: "Module title" }), "Advanced");
    const addButtons = screen.getAllByRole("button", { name: "Add module" });
    const submit = addButtons[addButtons.length - 1];
    if (!submit) throw new Error("Missing add module button");
    await user.click(submit);
    expect(await screen.findByRole("heading", { name: "2. Advanced" })).toBeInTheDocument();
    expect(body).toEqual({ title: "Advanced" });
  });

  it("renames a module optimistically and rolls back when the API refuses", async () => {
    mockBuilder();
    server.use(
      http.patch(`${API}/modules/51`, () =>
        HttpResponse.json({ detail: "You can only modify your own courses" }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: /^Renames*Getting set up/ }));
    const input = screen.getByRole("textbox", { name: "Module title" });
    await user.clear(input);
    await user.type(input, "Renamed module{Enter}");
    expect(await screen.findByText("You can only modify your own courses")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "1. Getting set up" })).toBeInTheDocument();
    });
  });

  it("asks before deleting a module", async () => {
    const state = mockBuilder();
    let deleted = 0;
    server.use(
      http.delete(`${API}/modules/51`, () => {
        deleted += 1;
        state.program = { ...state.program, modules: [] };
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Delete module Getting set up" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this module?" });
    expect(within(dialog).getByText(/and its 3 lessons/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Keep module" }));
    expect(deleted).toBe(0);

    await user.click(screen.getByRole("button", { name: "Delete module Getting set up" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete module" }),
    );
    expect(await screen.findByText("No modules yet")).toBeInTheDocument();
    expect(deleted).toBe(1);
  });

  it("edits a lesson and saves only the changed form", async () => {
    mockBuilder();
    let body: unknown = null;
    server.use(
      http.patch(`${API}/lessons/101`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(lessonDetail({ title: "Why types matter a lot" }));
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1/lessons/101", token: "t" });
    const title = await screen.findByLabelText("Title");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await user.clear(title);
    await user.type(title, "Why types matter a lot");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Lesson saved.")).toBeInTheDocument();
    expect(body).toMatchObject({
      title: "Why types matter a lot",
      content: "Types describe data.",
      lesson_type: "video",
      is_preview: false,
    });
  });

  it("validates the lesson form before saving", async () => {
    mockBuilder();
    const user = userEvent.setup();
    renderApp({ path: "/studio/courses/1/lessons/101", token: "t" });
    const title = await screen.findByLabelText("Title");
    await user.clear(title);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Enter a title")).toBeInTheDocument();
  });

  it("explains a course that does not exist", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 7, role: "teacher" }))),
      http.get(`${API}/courses/1`, () =>
        HttpResponse.json({ detail: "Course not found" }, { status: 404 }),
      ),
      http.get(`${API}/courses/1/program`, () =>
        HttpResponse.json({ detail: "Course not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: "/studio/courses/1", token: "t" });
    expect(await screen.findByRole("heading", { name: "Course not found" })).toBeInTheDocument();
  });
});
