import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Lesson, Progress } from "@/api/types";
import {
  API_URL,
  buildCourse,
  buildEnrollment,
  buildHistoryItem,
  buildLesson,
  buildModule,
  buildProgram,
  buildUser,
} from "@/test/factories";
import { buildProgressFor } from "@/test/progress-factory";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

import { applyLessonToggle } from "./progress-model";

const API = `${API_URL}/api/v1`;
const LESSON_URL = `${API}/lessons/101`;

const originalLocation = window.location;

afterEach(() => {
  authToken.clear();
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

function buildLessonDetail(overrides: Partial<Lesson> = {}): Lesson {
  return {
    ...buildLesson({ id: 101, title: "Why types matter", is_preview: true }),
    module_id: 51,
    content: "Types describe the shape of your data.",
    materials: [],
    ...overrides,
  };
}

const program = buildProgram({
  total_lessons: 2,
  modules: [
    buildModule({
      id: 51,
      course_id: 1,
      title: "Getting set up",
      lessons: [
        buildLesson({ id: 101, title: "Why types matter", is_preview: true }),
        buildLesson({ id: 102, title: "Compiler workflow" }),
      ],
    }),
  ],
});

function learnerProgress(): Progress {
  return buildProgressFor([{ id: 51, lessons: [{ id: 101 }, { id: 102 }] }]);
}

function mockLearner(options: { lesson?: Lesson; progress?: Progress } = {}) {
  const lesson = options.lesson ?? buildLessonDetail({ has_video: false });
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
    http.get(`${API}/courses/1`, () => HttpResponse.json(buildCourse())),
    http.get(`${API}/courses/1/program`, () => HttpResponse.json(program)),
    http.get(LESSON_URL, () => HttpResponse.json(lesson)),
    http.get(`${API}/enrollments/mine`, () => HttpResponse.json([buildEnrollment({ id: 11 })])),
    http.get(`${API}/enrollments/11/progress`, () =>
      HttpResponse.json(options.progress ?? learnerProgress()),
    ),
  );
}

describe("lesson player", () => {
  it("shows the lesson, the course path and the learner's progress", async () => {
    mockLearner();
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Why types matter" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Module 1 · Getting set up")).toBeInTheDocument();
    expect(screen.getByText("Types describe the shape of your data.")).toBeInTheDocument();
    expect(await screen.findByText("0% complete")).toBeInTheDocument();
    const path = screen.getByRole("complementary", { name: "Course path" });
    expect(within(path).getByRole("link", { name: /Compiler workflow/ })).toHaveAttribute(
      "href",
      "/learning/courses/1/lessons/102",
    );
    expect(within(path).getByRole("link", { name: /Why types matter/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("link", { name: "Next lesson" })).toHaveAttribute(
      "href",
      "/learning/courses/1/lessons/102",
    );
  });

  it("explains a video lesson that has no video yet", async () => {
    mockLearner({ lesson: buildLessonDetail({ has_video: false, lesson_type: "video" }) });
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    expect(await screen.findByText("No video for this lesson yet")).toBeInTheDocument();
  });

  it("shows article lessons without a video", async () => {
    mockLearner({ lesson: buildLessonDetail({ lesson_type: "article", has_video: false }) });
    const { container } = renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    await screen.findByRole("heading", { level: 1, name: "Why types matter" });
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByText("No video for this lesson yet")).not.toBeInTheDocument();
  });

  it("marks a lesson complete optimistically and keeps the server result", async () => {
    mockLearner();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`${API}/enrollments/11/lessons/101/complete`, async () => {
        await gate;
        return HttpResponse.json(applyLessonToggle(learnerProgress(), 101, true));
      }),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    await screen.findByText("0% complete");
    await user.click(await screen.findByRole("button", { name: "Mark as complete" }));
    expect(await screen.findByRole("button", { name: "Mark as incomplete" })).toBeInTheDocument();
    expect(screen.getByText("50% complete")).toBeInTheDocument();
    release();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark as incomplete" })).toBeEnabled();
    });
  });

  it("rolls the progress back when the server rejects the change", async () => {
    mockLearner();
    server.use(
      http.post(`${API}/enrollments/11/lessons/101/complete`, () =>
        HttpResponse.json(
          { detail: "Progress can only be changed while the enrollment is active" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Mark as complete" }));
    expect(
      await screen.findByText("Progress can only be changed while the enrollment is active"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark as complete" })).toBeInTheDocument();
    });
    expect(screen.getByText("0% complete")).toBeInTheDocument();
  });

  it("lists materials and downloads one with a fresh link", async () => {
    mockLearner({
      lesson: buildLessonDetail({
        has_video: false,
        materials: [
          {
            id: 9,
            title: "Cheat sheet",
            original_filename: "cheat.pdf",
            content_type: "application/pdf",
            size_bytes: 1_258_291,
          },
        ],
      }),
    });
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
    server.use(
      http.get(`${API}/materials/9/download-url`, () =>
        HttpResponse.json({ url: "http://localhost:9000/file.pdf?sig=1", expires_in: 3600 }),
      ),
    );
    const user = userEvent.setup();
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    await user.click(await screen.findByRole("tab", { name: "Materials (1)" }));
    expect(screen.getByText("PDF · 1.2 MB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Download Cheat sheet" }));
    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("http://localhost:9000/file.pdf?sig=1");
    });
  });

  it("handles keyboard shortcuts for the video", async () => {
    mockLearner({ lesson: buildLessonDetail({ has_video: true }) });
    server.use(
      http.get(`${API}/lessons/101/video-url`, () =>
        HttpResponse.json({ url: "http://localhost:9000/video.mp4?sig=1", expires_in: 3600 }),
      ),
    );
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const user = userEvent.setup();
    const { container } = renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    await screen.findByLabelText("Why types matter");
    const video = container.querySelector("video");
    if (!video) throw new Error("No video element rendered");

    await user.keyboard(" ");
    expect(play).toHaveBeenCalledTimes(1);
    expect(video.muted).toBe(false);
    await user.keyboard("m");
    expect(video.muted).toBe(true);
    await user.keyboard("m");
    expect(video.muted).toBe(false);
  });

  it("does not hijack the space key while a button has focus", async () => {
    mockLearner({ lesson: buildLessonDetail({ has_video: true }) });
    server.use(
      http.get(`${API}/lessons/101/video-url`, () =>
        HttpResponse.json({ url: "http://localhost:9000/video.mp4?sig=1", expires_in: 3600 }),
      ),
    );
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const user = userEvent.setup();
    renderApp({ path: "/learning/courses/1/lessons/101", token: "t" });
    const toggle = await screen.findByRole("button", { name: "Mark as complete" });
    toggle.focus();
    await user.keyboard("m");
    expect(play).not.toHaveBeenCalled();
  });
});

describe("lesson access", () => {
  beforeEach(() => {
    server.use(
      http.get(`${API}/courses/1`, () => HttpResponse.json(buildCourse())),
      http.get(`${API}/courses/1/program`, () => HttpResponse.json(program)),
      http.get(`${API}/lessons/102`, () =>
        HttpResponse.json({ detail: "Enroll in the course to open this lesson" }, { status: 403 }),
      ),
    );
  });

  it("asks a visitor to sign in", async () => {
    renderApp({ path: "/learning/courses/1/lessons/102" });
    expect(
      await screen.findByRole("heading", { name: "Enroll to open this lesson" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to continue" })).toHaveAttribute(
      "href",
      "/sign-in?next=%2Flearning%2Fcourses%2F1%2Flessons%2F102",
    );
  });

  it("sends a signed in student who is not enrolled to the course page", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/enrollments/mine`, () => HttpResponse.json([])),
    );
    renderApp({ path: "/learning/courses/1/lessons/102", token: "t" });
    expect(
      await screen.findByRole("heading", { name: "Enroll to open this lesson" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View course" })).toHaveAttribute("href", "/courses/1");
  });

  it("shows a not found message for a missing lesson", async () => {
    server.use(
      http.get(`${API}/lessons/102`, () =>
        HttpResponse.json({ detail: "Lesson not found" }, { status: 404 }),
      ),
    );
    renderApp({ path: "/learning/courses/1/lessons/102" });
    expect(await screen.findByRole("heading", { name: "Lesson not found" })).toBeInTheDocument();
  });

  it("lets a visitor open a preview lesson without progress controls", async () => {
    server.use(
      http.get(LESSON_URL, () => HttpResponse.json(buildLessonDetail({ has_video: false }))),
    );
    renderApp({ path: "/learning/courses/1/lessons/101" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Why types matter" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as complete" })).not.toBeInTheDocument();
    const path = screen.getByRole("complementary", { name: "Course path" });
    expect(within(path).queryByRole("link", { name: /Compiler workflow/ })).not.toBeInTheDocument();
  });
});

describe("course entry", () => {
  it("redirects to the next unfinished lesson", async () => {
    const progress = buildProgressFor([
      { id: 51, lessons: [{ id: 101, completed: true }, { id: 102 }] },
    ]);
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/enrollments/mine`, () => HttpResponse.json([buildEnrollment({ id: 11 })])),
      http.get(`${API}/enrollments/11/progress`, () => HttpResponse.json(progress)),
    );
    const { router } = renderApp({ path: "/learning/courses/1", token: "t" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/learning/courses/1/lessons/102");
    });
  });

  it("sends a student without an active enrollment to the course page", async () => {
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
      http.get(`${API}/enrollments/mine`, () =>
        HttpResponse.json([buildEnrollment({ id: 11, status: "pending_payment" })]),
      ),
    );
    const { router } = renderApp({ path: "/learning/courses/1", token: "t" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/courses/1");
    });
  });
});

describe("dashboard", () => {
  it("shows the resume card, stats, certificates and recent activity", async () => {
    const enrollment = buildEnrollment({ id: 11 });
    const progress = buildProgressFor([
      {
        id: 51,
        lessons: [
          { id: 101, completed: true },
          { id: 102, title: "Compiler workflow" },
        ],
      },
    ]);
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2, name: "Andrii" }))),
      http.get(`${API}/learning/history`, () =>
        HttpResponse.json([
          buildHistoryItem(enrollment, {
            progress: progress.progress,
            last_activity_at: "2026-03-01T10:00:00Z",
          }),
        ]),
      ),
      http.get(`${API}/enrollments/11/progress`, () => HttpResponse.json(progress)),
      http.get(`${API}/certificates/mine`, () =>
        HttpResponse.json([
          {
            id: 1,
            certificate_number: "CERT-2026-AAAA",
            issued_at: "2026-03-01T10:00:00Z",
            enrollment_id: 5,
            course_id: 9,
            course_title: "Python for Beginners",
            student_name: "Andrii K",
            teacher_name: "Olena M",
          },
        ]),
      ),
    );
    renderApp({ path: "/learning", token: "t" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Welcome back, Andrii" }),
    ).toBeInTheDocument();
    const resume = await screen.findByRole("region", { name: "Resume learning" });
    expect(within(resume).getByRole("heading", { name: "Compiler workflow" })).toBeInTheDocument();
    expect(within(resume).getByRole("link", { name: "Continue lesson" })).toHaveAttribute(
      "href",
      "/learning/courses/1/lessons/102",
    );
    expect(within(resume).getByText("10 min left")).toBeInTheDocument();
    expect(await screen.findByText("CERT-2026-AAAA")).toBeInTheDocument();
    expect(screen.getByText("Lessons completed")).toBeInTheDocument();
    expect(screen.getByText("Studied TypeScript from zero to production")).toBeInTheDocument();
  });
});
