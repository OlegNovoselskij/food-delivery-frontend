import { expect, test, type Page } from "@playwright/test";

import { completeLessonWithToken, createEnrolledStudent, type TestUser } from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const COURSE_ID = 3;
const API_URL = "http://localhost:8000/api/v1";

let learner: TestUser;
let beginner: TestUser;

async function firstLessonId(): Promise<number> {
  const response = await fetch(`${API_URL}/courses/${COURSE_ID}/program`);
  const program = (await response.json()) as { modules: { lessons: { id: number }[] }[] };
  const lesson = program.modules[0]?.lessons[0];
  if (lesson === undefined) throw new Error("The seed course has no lesson");
  return lesson.id;
}

async function enrollmentIdFor(token: string): Promise<number> {
  const response = await fetch(`${API_URL}/enrollments/mine?course_id=${COURSE_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const [enrollment] = (await response.json()) as { id: number }[];
  if (enrollment === undefined) throw new Error("No enrollment found");
  return enrollment.id;
}

test.beforeAll(async () => {
  await resetRateLimits();
  learner = await createEnrolledStudent("e2e-review", COURSE_ID);
  await completeLessonWithToken(
    learner.token,
    await enrollmentIdFor(learner.token),
    await firstLessonId(),
  );
  beginner = await createEnrolledStudent("e2e-review-new", COURSE_ID);
});

async function openReviews(page: Page): Promise<void> {
  await page.goto(`/courses/${COURSE_ID}?tab=reviews`);
  await expect(page.getByRole("tab", { name: "Reviews", selected: true })).toBeVisible();
}

test("a visitor reads the reviews and sees no form", async ({ page }) => {
  await openReviews(page);
  await expect(page.getByText("Based on")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Write a review" })).toHaveCount(0);
});

test("the API's rule about starting the course first is shown in the form", async ({ page }) => {
  await useToken(page, beginner.token);
  await openReviews(page);
  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByRole("button", { name: "Publish review" }).click();
  await expect(page.getByText("Start learning the course before reviewing it")).toBeVisible();
});

test("a student who started the course writes, edits and deletes a review", async ({ page }) => {
  await useToken(page, learner.token);
  await openReviews(page);

  await page.getByRole("button", { name: "Publish review" }).click();
  await expect(page.getByText("Choose a rating from 1 to 5 stars")).toBeVisible();

  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Comment (optional)").fill("Clear explanations and good exercises.");
  await page.getByRole("button", { name: "Publish review" }).click();

  const own = page.getByRole("region", { name: "Your review" });
  await expect(own).toBeVisible();
  await expect(own.getByText("Clear explanations and good exercises.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Rated 4.0 out of 5" }).first()).toBeVisible();

  await own.getByRole("button", { name: "Edit review" }).click();
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(own.getByRole("img", { name: "Rated 5.0 out of 5" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("region", { name: "Your review" })).toBeVisible();

  await page.getByRole("button", { name: "Delete review" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete your review?" })
    .getByRole("button", { name: "Delete review" })
    .click();
  await expect(page.getByRole("heading", { name: "Write a review" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your review" })).toHaveCount(0);
});

test("a student who is not enrolled does not see the form", async ({ page }) => {
  const other = await createEnrolledStudent("e2e-review-other", 1);
  await useToken(page, other.token);
  await openReviews(page);
  await expect(page.getByRole("heading", { name: "Write a review" })).toHaveCount(0);
});
