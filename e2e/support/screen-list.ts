import type { Page } from "@playwright/test";

import {
  SEED_USERS,
  cancelWithToken,
  createEnrolledStudent,
  createReviewWithToken,
  createStudent,
  enrollWithToken,
  seedToken,
  startAttemptWithToken,
  startLearningCourse,
  submitAttemptWithToken,
} from "./api";
import {
  archiveCourse,
  createDraftCourse,
  createQuizCourse,
  deleteDraftCourse,
  type DraftCourse,
  type QuizCourse,
} from "./courses";
import { ensureSeedVideos } from "./media";
import type { ScreenSpec } from "./screens";

const REGISTER_URL = "**/api/v1/auth/register";
const COURSES_URL = "**/api/v1/courses?*";
const API_URL = "http://localhost:8000/api/v1";

const VIDEO_READY_STATE = 2;
const PREVIEW_FRAME_SECONDS = 1.6;
const FASTAPI_COURSE_ID = 2;
const PYTHON_COURSE_ID = 1;

async function waitForVideoFrame(page: Page): Promise<void> {
  await page.waitForFunction(
    (state) => (document.querySelector("video")?.readyState ?? 0) >= state,
    VIDEO_READY_STATE,
  );
  await page.evaluate(
    (time) =>
      new Promise<void>((done) => {
        const video = document.querySelector("video");
        if (video === null) {
          done();
          return;
        }
        video.addEventListener(
          "seeked",
          () => {
            done();
          },
          { once: true },
        );
        video.currentTime = time;
      }),
    PREVIEW_FRAME_SECONDS,
  );
}

async function certificateNumber(): Promise<string> {
  const token = await seedToken(SEED_USERS.student);
  const response = await fetch(`${API_URL}/certificates/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const certificates = (await response.json()) as { certificate_number: string }[];
  const first = certificates[0];
  if (first === undefined) throw new Error("The seed student has no certificate");
  return first.certificate_number;
}

async function seedQuizId(): Promise<number> {
  const token = await seedToken(SEED_USERS.teacher);
  const response = await fetch(`${API_URL}/courses/${FASTAPI_COURSE_ID}/program`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const program = (await response.json()) as { modules: { quiz_id: number | null }[] };
  const quizId = program.modules.find((module) => module.quiz_id !== null)?.quiz_id;
  if (quizId === undefined || quizId === null) throw new Error("The seed course has no quiz");
  return quizId;
}

function once<T>(factory: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= factory();
    return pending;
  };
}

async function createStatesStudent(): Promise<string> {
  const { token } = await createStudent("shot-states");
  await enrollWithToken(token, 5);
  await enrollWithToken(token, 3);
  const cancelledId = await enrollWithToken(token, 6);
  await cancelWithToken(token, cancelledId);
  return token;
}

async function createPendingStudent(): Promise<string> {
  const { token } = await createStudent("shot-pay");
  await enrollWithToken(token, 5);
  return token;
}

let quizCourseCreated = false;

const quizCourse = once(() => {
  quizCourseCreated = true;
  return createQuizCourse();
});

const createdDrafts: DraftCourse[] = [];

async function newDraft(withModule: boolean): Promise<DraftCourse> {
  const draft = await createDraftCourse(withModule);
  createdDrafts.push(draft);
  return draft;
}

const draftWithModule = once(() => newDraft(true));
const emptyDraft = once(() => newDraft(false));

export async function disposeQuizCourse(): Promise<void> {
  if (quizCourseCreated) await archiveCourse(await quizCourse());
  for (const draft of createdDrafts) await deleteDraftCourse(draft).catch(() => undefined);
}

async function quizStudent(prefix: string): Promise<{ token: string; course: QuizCourse }> {
  const course = await quizCourse();
  const student = await createStudent(prefix);
  await enrollWithToken(student.token, course.courseId);
  return { token: student.token, course };
}

const quizIntroStudent = once(() => quizStudent("shot-quiz-intro"));
const quizTakingStudent = once(() => quizStudent("shot-quiz-take"));

async function submittedAttempt(
  prefix: string,
  choices: readonly { chooseTexts: readonly string[] }[],
): Promise<{ token: string; path: string }> {
  const { token, course } = await quizStudent(prefix);
  const attempt = await startAttemptWithToken(token, course.quizId);
  const attemptId = await submitAttemptWithToken(token, attempt, choices);
  return { token, path: `/learning/attempts/${attemptId}?course=${course.courseId}` };
}

const failedAttempt = once(() =>
  submittedAttempt("shot-failed", [{ chooseTexts: ["var"] }, { chooseTexts: ["object"] }]),
);
const passedAttempt = once(() =>
  submittedAttempt("shot-passed", [
    { chooseTexts: ["const"] },
    { chooseTexts: ["string", "number"] },
  ]),
);
const pendingAttempt = once(async () => {
  const student = await createEnrolledStudent("shot-pending", 2);
  const attempt = await startAttemptWithToken(student.token, 2);
  const attemptId = await submitAttemptWithToken(student.token, attempt, [
    { chooseTexts: [attempt.questions[0]?.options[0]?.text ?? ""] },
    { chooseTexts: [attempt.questions[1]?.options[0]?.text ?? ""] },
    { text: "Types catch mistakes before the code runs." },
  ]);
  return {
    token: student.token,
    attemptId,
    path: `/learning/attempts/${attemptId}?course=2`,
  };
});

const reviewFormStudent = once(async () => (await startLearningCourse("shot-review", 3)).token);
const reviewOwnStudent = once(async () => {
  const student = await startLearningCourse("shot-review-own", 3);
  await createReviewWithToken(
    student.token,
    3,
    5,
    "Clear explanations and exercises that mirror real work.",
  );
  return student.token;
});

const studentWithEveryStatus = once(createStatesStudent);
const studentWithPendingPayment = once(createPendingStudent);
const emptyStudent = once(async () => (await createStudent("shot-empty")).token);

export const SCREENS: readonly ScreenSpec[] = [
  { name: "not-found", path: "/no/such/page" },
  { name: "forbidden", path: "/403" },
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
  {
    name: "sign-up-code",
    path: "/sign-up",
    prepare: async (page) => {
      await page.route(REGISTER_URL, (route) =>
        route.fulfill({ status: 202, json: { message: "sent" } }),
      );
      await page.getByLabel("First name").fill("Andrii");
      await page.getByLabel("Last name").fill("Kovalenko");
      await page.getByLabel("Email").fill("andrii@demo.example.com");
      await page.getByRole("button", { name: "Send confirmation code" }).click();
      await page.getByRole("heading", { name: "Check your email" }).waitFor();
      await page.getByRole("textbox", { name: "Digit 1 of 6" }).click();
      await page.keyboard.type("4718");
    },
  },
  { name: "forgot-password", path: "/forgot-password" },
  { name: "reset-password", path: "/reset-password?email=andrii%40demo.example.com" },
  { name: "profile", path: "/profile", signedInAs: SEED_USERS.student },
  {
    name: "catalog",
    path: "/courses",
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-signed-in",
    path: "/courses",
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-filtered",
    path: "/courses?category=1&sort=price_desc",
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-empty",
    path: "/courses?q=zzzznothing",
    waitFor: (page) => page.getByRole("heading", { name: "No courses match your filters" }),
  },
  {
    name: "catalog-loading",
    path: "/courses",
    intercept: async (page) => {
      await page.route(COURSES_URL, () => new Promise<void>(() => undefined));
    },
    waitFor: (page) => page.getByRole("status", { name: "Loading courses" }),
  },
  {
    name: "catalog-error",
    path: "/courses",
    intercept: async (page) => {
      await page.route(COURSES_URL, (route) =>
        route.fulfill({
          status: 500,
          json: { detail: "Internal server error", request_id: "9f3a1c" },
        }),
      );
    },
    waitFor: (page) => page.getByRole("button", { name: "Try again" }),
  },
  {
    name: "catalog-pagination",
    path: "/courses?page=2",
    intercept: async (page) => {
      await page.route(COURSES_URL, async (route) => {
        const response = await route.fetch({
          url: route.request().url().replace("page=2", "page=1"),
        });
        const body = (await response.json()) as Record<string, unknown>;
        await route.fulfill({ response, json: { ...body, total: 40, page: 2 } });
      });
    },
    waitFor: (page) => page.getByRole("navigation", { name: "Pagination" }),
  },
  {
    name: "course-visitor",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    waitFor: (page) => page.getByRole("link", { name: "Enroll in course" }),
  },
  {
    name: "course-student",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("link", { name: "Continue learning" }),
  },
  {
    name: "course-owner",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("link", { name: "Edit in studio" }),
  },
  {
    name: "course-free",
    path: `/courses/${PYTHON_COURSE_ID}`,
    signedInAs: SEED_USERS.admin,
    waitFor: (page) => page.getByRole("button", { name: "Enroll for free" }),
  },
  {
    name: "course-reviews",
    path: `/courses/${PYTHON_COURSE_ID}?tab=reviews`,
    waitFor: (page) => page.getByText("Based on"),
  },
  {
    name: "course-not-found",
    path: "/courses/999999",
    waitFor: (page) => page.getByRole("heading", { name: "Course not found" }),
  },
  {
    name: "certificate-valid",
    path: async () => `/certificates/verify/${await certificateNumber()}`,
    waitFor: (page) => page.getByRole("heading", { name: "Valid certificate" }),
  },
  {
    name: "certificate-invalid",
    path: "/certificates/verify/CERT-0000-NOPE",
    waitFor: (page) => page.getByRole("heading", { name: "Certificate not found" }),
  },
  {
    name: "learning",
    path: "/learning",
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("heading", { name: "FastAPI in Practice" }),
  },
  {
    name: "learning-states",
    path: "/learning",
    tokenFor: studentWithEveryStatus,
    waitFor: (page) => page.getByRole("heading", { name: "Marketing Analytics 101" }),
  },
  {
    name: "learning-empty",
    path: "/learning",
    tokenFor: emptyStudent,
    waitFor: (page) => page.getByText("You are not enrolled in any course yet"),
  },
  {
    name: "payment-dialog",
    path: `/courses/5`,
    tokenFor: studentWithPendingPayment,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Pay now" }).click();
      await page.getByLabel("Card number").fill("4242424242424242");
      await page.getByLabel("Expiry").fill("1299");
    },
    waitFor: (page) => page.getByRole("dialog", { name: "Complete your payment" }),
  },
  {
    name: "confirm-cancel",
    path: "/learning",
    tokenFor: studentWithPendingPayment,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Cancel enrollment" }).click();
    },
    waitFor: (page) => page.getByRole("alertdialog", { name: "Cancel enrollment?" }),
  },
  {
    name: "lesson-player",
    path: async () => {
      await ensureSeedVideos(2, [7, 8, 10, 11]);
      return "/learning/courses/2/lessons/8";
    },
    signedInAs: SEED_USERS.student,
    prepare: waitForVideoFrame,
    waitFor: (page) => page.locator("video"),
  },
  {
    name: "lesson-preview-visitor",
    path: "/learning/courses/2/lessons/7",
    prepare: waitForVideoFrame,
    waitFor: (page) => page.locator("video"),
  },
  {
    name: "lesson-locked",
    path: "/learning/courses/2/lessons/8",
    waitFor: (page) => page.getByRole("heading", { name: "Enroll to open this lesson" }),
  },
  {
    name: "lesson-article",
    path: "/learning/courses/2/lessons/9",
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("heading", { level: 1, name: "Database access" }),
  },
  {
    name: "lesson-loading",
    path: "/learning/courses/2/lessons/8",
    signedInAs: SEED_USERS.student,
    intercept: async (page) => {
      await page.route("**/api/v1/lessons/8", () => new Promise<void>(() => undefined));
    },
    waitFor: (page) => page.getByRole("status", { name: "Loading lesson" }),
  },
  {
    name: "lesson-path-drawer",
    path: "/learning/courses/2/lessons/8",
    signedInAs: SEED_USERS.student,
    prepare: async (page) => {
      await page.getByRole("heading", { level: 1, name: "Dependency injection" }).waitFor();
      const open = page.getByRole("button", { name: "Your path" });
      if (await open.isVisible()) await open.click();
    },
    waitFor: (page) => page.locator("h1").or(page.getByRole("dialog")).first(),
  },
  {
    name: "quiz-intro",
    path: async () => {
      const { course } = await quizIntroStudent();
      return `/learning/quizzes/${course.quizId}?course=${course.courseId}`;
    },
    tokenFor: async () => (await quizIntroStudent()).token,
    waitFor: (page) => page.getByRole("heading", { level: 1, name: "Basics checkpoint" }),
  },
  {
    name: "quiz-taking",
    path: async () => {
      const { course } = await quizTakingStudent();
      return `/learning/quizzes/${course.quizId}?course=${course.courseId}`;
    },
    tokenFor: async () => (await quizTakingStudent()).token,
    prepare: async (page) => {
      await page.getByRole("button", { name: /Start quiz|Continue quiz/ }).click();
      await page.getByRole("radio", { name: "const" }).check();
    },
    waitFor: (page) => page.getByText("Pass mark: 60%"),
  },
  {
    name: "quiz-result-failed",
    path: async () => (await failedAttempt()).path,
    tokenFor: async () => (await failedAttempt()).token,
    waitFor: (page) => page.getByRole("heading", { name: "Not passed yet" }),
  },
  {
    name: "quiz-result-passed",
    path: async () => (await passedAttempt()).path,
    tokenFor: async () => (await passedAttempt()).token,
    waitFor: (page) => page.getByRole("heading", { name: "You passed" }),
  },
  {
    name: "quiz-result-pending",
    path: async () => (await pendingAttempt()).path,
    tokenFor: async () => (await pendingAttempt()).token,
    waitFor: (page) => page.getByRole("heading", { name: "Waiting for your teacher" }),
  },
  {
    name: "reviews-form",
    path: "/courses/3?tab=reviews",
    tokenFor: reviewFormStudent,
    waitFor: (page) => page.getByRole("heading", { name: "Write a review" }),
  },
  {
    name: "reviews-own",
    path: "/courses/3?tab=reviews",
    tokenFor: reviewOwnStudent,
    waitFor: (page) => page.getByRole("region", { name: "Your review" }),
  },
  {
    name: "certificates",
    path: "/certificates",
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("button", { name: "Download PDF" }),
  },
  {
    name: "certificates-empty",
    path: "/certificates",
    tokenFor: emptyStudent,
    waitFor: (page) => page.getByRole("heading", { name: "No certificates yet" }),
  },
  {
    name: "notifications",
    path: "/notifications",
    signedInAs: SEED_USERS.student,
    waitFor: (page) =>
      page.getByText("Quiz graded", { exact: false }).or(page.getByText("Your quiz was graded")),
  },
  {
    name: "notifications-empty",
    path: "/notifications",
    tokenFor: emptyStudent,
    waitFor: (page) => page.getByRole("heading", { name: "No notifications yet" }),
  },
  {
    name: "notification-bell-open",
    path: "/courses",
    signedInAs: SEED_USERS.student,
    prepare: async (page) => {
      await page.getByRole("button", { name: /Notifications, \d+ unread/ }).click();
      await page.getByText("Your quiz was graded").first().waitFor();
    },
    waitFor: (page) => page.getByRole("dialog", { name: "Notifications" }),
  },
  {
    name: "studio-dashboard",
    path: "/studio",
    signedInAs: SEED_USERS.cleanTeacher,
    waitFor: (page) => page.getByRole("heading", { name: "Your courses" }),
  },
  {
    name: "studio-create",
    path: "/studio/courses/new",
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("heading", { level: 1, name: "Create a course" }),
  },
  {
    name: "studio-builder",
    path: "/studio/courses/2/lessons/8",
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("heading", { level: 2, name: "Dependency injection" }),
  },
  {
    name: "studio-builder-empty",
    path: async () => `/studio/courses/${(await emptyDraft()).courseId}`,
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByText("No modules yet"),
  },
  {
    name: "studio-builder-add-lesson",
    path: async () => `/studio/courses/${(await draftWithModule()).courseId}`,
    signedInAs: SEED_USERS.teacher,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Add lesson to First module" }).click();
      await page.getByLabel("Lesson title").fill("Introduction");
    },
    waitFor: (page) => page.getByLabel("Lesson title"),
  },
  {
    name: "studio-settings",
    path: "/studio/courses/2",
    signedInAs: SEED_USERS.teacher,
    prepare: async (page) => {
      await page.getByRole("tab", { name: "Settings" }).click();
    },
    waitFor: (page) => page.getByRole("button", { name: "Save details" }),
  },
  {
    name: "studio-quiz-builder",
    path: async () => `/studio/courses/${FASTAPI_COURSE_ID}/quizzes/${await seedQuizId()}`,
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("list", { name: "Questions" }),
  },
  {
    name: "studio-quiz-question-edit",
    path: async () => `/studio/courses/${FASTAPI_COURSE_ID}/quizzes/${await seedQuizId()}`,
    signedInAs: SEED_USERS.teacher,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Edit question 1" }).click();
    },
    waitFor: (page) => page.getByRole("button", { name: "Save question" }),
  },
  {
    name: "studio-grading",
    path: async () => {
      await pendingAttempt();
      return "/studio/grading";
    },
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("list", { name: "Attempts waiting for review" }),
  },
  {
    name: "studio-grading-review",
    path: async () => `/studio/grading/${(await pendingAttempt()).attemptId}`,
    signedInAs: SEED_USERS.teacher,
    prepare: async (page) => {
      await page.getByLabel("Points for answer 1").fill("9");
      await page.getByRole("button", { name: "Save grades" }).click();
    },
    waitFor: (page) => page.getByText("Enter whole points from 0 to 5"),
  },
];
