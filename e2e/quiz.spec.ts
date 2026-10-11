import { expect, test } from "@playwright/test";

import {
  createEnrolledStudent,
  createStudent,
  enrollWithToken,
  type TestUser,
} from "./support/api";
import { archiveCourse, createQuizCourse, type QuizCourse } from "./support/courses";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const SEED_QUIZ_COURSE_ID = 2;
const SEED_QUIZ_ID = 2;

let course: QuizCourse;
let student: TestUser;

test.beforeAll(async () => {
  await resetRateLimits();
  course = await createQuizCourse();
  student = await createEnrolledStudent("e2e-quiz", SEED_QUIZ_COURSE_ID);
  await enrollWithToken(student.token, course.courseId);
});

test.afterAll(async () => {
  await archiveCourse(course);
});

function quizUrl(): string {
  return `/learning/quizzes/${course.quizId}?course=${course.courseId}`;
}

test("a student fails a quiz, retries and passes it", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(quizUrl());
  await expect(page.getByRole("heading", { level: 1, name: "Basics checkpoint" })).toBeVisible();
  await expect(page.getByText("You have not taken this quiz yet.")).toBeVisible();

  await page.getByRole("button", { name: "Start quiz" }).click();
  await expect(page.getByText("0 of 2 answered")).toBeVisible();
  await page.getByRole("radio", { name: "var" }).check();
  await page.getByRole("checkbox", { name: "object" }).check();
  await expect(page.getByText("2 of 2 answered")).toBeVisible();
  await page.getByRole("button", { name: "Submit quiz" }).click();

  await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
  await expect(page.getByText(/The pass mark is 60%/)).toBeVisible();
  await expect(page.getByText("Incorrect").first()).toBeVisible();
  await expect(page.getByText("const declares a binding")).toBeVisible();

  await page.getByRole("link", { name: "Try again" }).click();
  await expect(page.getByText("Attempt 1")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();

  await page.getByRole("radio", { name: "const" }).check();
  await page.getByRole("checkbox", { name: "string" }).check();
  await page.getByRole("checkbox", { name: "number" }).check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.getByRole("heading", { name: "You passed" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Score 100 percent, passed/ })).toBeVisible();

  await page.goto(quizUrl());
  await expect(page.getByText(/You passed this quiz with 100%/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Start quiz|Try again/ })).toHaveCount(0);
});

test("answers survive a reload and unanswered questions ask for confirmation", async ({ page }) => {
  const fresh = await createStudent("e2e-quiz-draft");
  await enrollWithToken(fresh.token, course.courseId);
  await useToken(page, fresh.token);
  await page.goto(quizUrl());
  await page.getByRole("button", { name: "Start quiz" }).click();
  await page.getByRole("radio", { name: "const" }).check();
  await expect(page.getByText("1 of 2 answered")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Continue quiz" }).click();
  await expect(page.getByText("1 of 2 answered")).toBeVisible();
  await expect(page.getByRole("radio", { name: "const" })).toBeChecked();

  await page.getByRole("button", { name: "Submit quiz" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Submit with unanswered questions?" });
  await expect(dialog.getByText(/1 question unanswered/)).toBeVisible();
  await dialog.getByRole("button", { name: "Keep working" }).click();
  await expect(page.getByRole("button", { name: "Submit quiz" })).toBeEnabled();
});

test("written answers wait for the teacher and block a second attempt", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(`/learning/quizzes/${SEED_QUIZ_ID}?course=${SEED_QUIZ_COURSE_ID}`);
  await page.getByRole("button", { name: "Start quiz" }).click();
  await expect(page.getByText(/0 of 3 answered/)).toBeVisible();

  await page.getByRole("radio").first().check();
  await page.getByRole("checkbox").first().check();
  await page.getByLabel("Your answer").fill("Because it keeps the code honest.");
  await page.getByRole("button", { name: "Submit quiz" }).click();

  await expect(page.getByRole("heading", { name: "Waiting for your teacher" })).toBeVisible();
  await expect(page.getByText("Awaiting review")).toBeVisible();
  await expect(page.getByText("Because it keeps the code honest.")).toBeVisible();

  await page.goto(`/learning/quizzes/${SEED_QUIZ_ID}?course=${SEED_QUIZ_COURSE_ID}`);
  await expect(page.getByText(/still has to grade/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Start quiz|Try again/ })).toHaveCount(0);
});

test("a visitor is sent to sign in before a quiz", async ({ page }) => {
  await page.goto(quizUrl());
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});
