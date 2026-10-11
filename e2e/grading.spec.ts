import { expect, test } from "@playwright/test";

import {
  SEED_USERS,
  createEnrolledStudent,
  seedToken,
  startAttemptWithToken,
  submitAttemptWithToken,
  type TestUser,
} from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const SEED_QUIZ_COURSE_ID = 2;
const SEED_QUIZ_ID = 2;
const OPEN_ANSWER = "Dependencies are passed in, so they can be swapped in tests.";
const OPEN_QUESTION_POINTS = 5;

let student: TestUser;
let teacherToken: string;
let attemptId: number;

test.beforeAll(async () => {
  await resetRateLimits();
  teacherToken = await seedToken(SEED_USERS.teacher);
  student = await createEnrolledStudent("e2e-grading", SEED_QUIZ_COURSE_ID);
  const attempt = await startAttemptWithToken(student.token, SEED_QUIZ_ID);
  attemptId = await submitAttemptWithToken(student.token, attempt, [
    { chooseTexts: [attempt.questions[0]?.options[0]?.text ?? ""] },
    { chooseTexts: [attempt.questions[1]?.options[0]?.text ?? ""] },
    { text: OPEN_ANSWER },
  ]);
});

test("a teacher grades a written answer and the student sees the result", async ({
  page,
  browser,
}) => {
  await useToken(page, teacherToken);
  await page.goto("/studio/grading");
  await expect(page.getByRole("heading", { level: 1, name: "Grading" })).toBeVisible();

  await page.locator(`a[href="/studio/grading/${attemptId}"]`).click();
  await expect(page.getByText(OPEN_ANSWER)).toBeVisible();
  await expect(page.getByText(`worth ${OPEN_QUESTION_POINTS} points`)).toBeVisible();

  await page.getByLabel("Points for answer 1").fill("9");
  await page.getByRole("button", { name: "Save grades" }).click();
  await expect(
    page.getByText(`Enter whole points from 0 to ${OPEN_QUESTION_POINTS}`),
  ).toBeVisible();

  await page.getByLabel("Points for answer 1").fill("4");
  await page.getByLabel("Comment for answer 1").fill("Good, mention constructor injection too.");
  await page.getByRole("button", { name: "Save grades" }).click();

  await expect(page.getByText("Grades saved. The student has been notified.")).toBeVisible();
  await expect(page).toHaveURL(/\/studio\/grading$/);
  await expect(page.locator(`a[href="/studio/grading/${attemptId}"]`)).toHaveCount(0);

  const studentPage = await (await browser.newContext()).newPage();
  await useToken(studentPage, student.token);
  await studentPage.goto(`/learning/attempts/${attemptId}?course=${SEED_QUIZ_COURSE_ID}`);
  await expect(studentPage.getByText("Good, mention constructor injection too.")).toBeVisible();
  await expect(studentPage.getByText(/4 of 5 points/)).toBeVisible();
  await studentPage.close();

  await page.goto(`/studio/grading/${attemptId}`);
  await expect(page.getByRole("heading", { name: "Already graded" })).toBeVisible();
});
