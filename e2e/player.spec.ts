import { expect, test, type Page } from "@playwright/test";

import { createEnrolledStudent, type TestUser } from "./support/api";
import { ensureSeedVideos } from "./support/media";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const COURSE_ID = 2;
const PREVIEW_LESSON_ID = 7;
const SECOND_LESSON_ID = 8;
const ARTICLE_LESSON_ID = 9;
const VIDEO_LESSON_IDS = [7, 8, 10, 11] as const;

let student: TestUser;

test.beforeAll(async () => {
  await resetRateLimits();
  await ensureSeedVideos(COURSE_ID, VIDEO_LESSON_IDS);
  student = await createEnrolledStudent("e2e-player", COURSE_ID);
});

async function videoState(page: Page) {
  return page.evaluate(() => {
    const video = document.querySelector("video");
    return video
      ? {
          paused: video.paused,
          muted: video.muted,
          time: video.currentTime,
          ready: video.readyState,
        }
      : null;
  });
}

test("a student resumes at the next lesson, plays the video and uses keyboard shortcuts", async ({
  page,
}) => {
  await useToken(page, student.token);

  await page.goto("/learning");
  await page.getByRole("link", { name: "Continue lesson" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}$`),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Routing and validation" }),
  ).toBeVisible();

  await expect.poll(async () => (await videoState(page))?.ready ?? 0).toBeGreaterThanOrEqual(2);
  await page.locator("main h1").click();
  await page.keyboard.press("Space");
  await expect.poll(async () => (await videoState(page))?.paused).toBe(false);
  await expect.poll(async () => (await videoState(page))?.time ?? 0).toBeGreaterThan(0.2);
  await page.keyboard.press("Space");
  await expect.poll(async () => (await videoState(page))?.paused).toBe(true);

  await page.keyboard.press("m");
  await expect.poll(async () => (await videoState(page))?.muted).toBe(true);
  await page.keyboard.press("m");
  await expect.poll(async () => (await videoState(page))?.muted).toBe(false);
});

test("marking a lesson complete updates progress immediately and survives a reload", async ({
  page,
}) => {
  await useToken(page, student.token);
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}`);
  await expect(page.getByText("0% complete")).toBeVisible();

  await page.getByRole("button", { name: "Mark as complete" }).click();
  await expect(page.getByRole("button", { name: "Mark as incomplete" })).toBeVisible();
  await expect(page.getByText("14% complete")).toBeVisible();
  const path = page.getByRole("complementary", { name: "Course path" });
  await expect(path.getByText("Routing and validation").first()).toBeVisible();
  await expect(path.getByText("Completed", { exact: false }).first()).toBeAttached();

  await page.reload();
  await expect(page.getByRole("button", { name: "Mark as incomplete" })).toBeVisible();
  await expect(page.getByText("14% complete")).toBeVisible();

  await page.getByRole("button", { name: "Mark as incomplete" }).click();
  await expect(page.getByRole("button", { name: "Mark as complete" })).toBeVisible();
  await expect(page.getByText("0% complete")).toBeVisible();

  await page.getByRole("link", { name: "Next lesson" }).click();
  await expect(page).toHaveURL(new RegExp(`/lessons/${SECOND_LESSON_ID}$`));
});

test("the course entry link goes to the next unfinished lesson", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}`);
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await expect(page.getByText("14% complete")).toBeVisible();

  await page.goto(`/learning/courses/${COURSE_ID}`);
  await expect(page).toHaveURL(new RegExp(`/lessons/${SECOND_LESSON_ID}$`));
});

test("article lessons show their text and no video", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${ARTICLE_LESSON_ID}`);
  await expect(page.getByRole("heading", { level: 1, name: "Database access" })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByText(/focused lesson/)).toBeVisible();
});

test("a visitor can open a preview lesson but not the others", async ({ page }) => {
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}`);
  await expect(page.locator("video")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as complete" })).toHaveCount(0);

  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${SECOND_LESSON_ID}`);
  await expect(page.getByRole("heading", { name: "Enroll to open this lesson" })).toBeVisible();
  await page.getByRole("link", { name: "Sign in to continue" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});

test("a signed in student who is not enrolled is asked to enroll", async ({ page }) => {
  await useToken(page, student.token);
  const program = await fetch("http://localhost:8000/api/v1/courses/3/program");
  const body = (await program.json()) as { modules: { lessons: { id: number }[] }[] };
  const lessonId = body.modules[0]?.lessons[1]?.id;
  await page.goto(`/learning/courses/3/lessons/${lessonId}`);
  await expect(page.getByRole("heading", { name: "Enroll to open this lesson" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View course" })).toBeVisible();
});

test("the player recovers when the video link has expired", async ({ page }) => {
  await useToken(page, student.token);
  let served = 0;
  await page.route(`**/api/v1/lessons/${PREVIEW_LESSON_ID}/video-url`, async (route) => {
    served += 1;
    if (served === 1) {
      await route.fulfill({
        json: { url: "http://localhost:9000/courses/expired-link.webm", expires_in: 3600 },
      });
      return;
    }
    await route.continue();
  });
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}`);
  await expect.poll(async () => (await videoState(page))?.ready ?? 0).toBeGreaterThanOrEqual(2);
  expect(served).toBeGreaterThanOrEqual(2);
});

test("the path drawer works on a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await useToken(page, student.token);
  await page.goto(`/learning/courses/${COURSE_ID}/lessons/${PREVIEW_LESSON_ID}`);
  await expect(page.getByRole("complementary", { name: "Course path" })).toBeHidden();
  await page.getByRole("button", { name: "Your path" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: /Dependency injection/ }).click();
  await expect(page).toHaveURL(new RegExp(`/lessons/${SECOND_LESSON_ID}$`));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await context.close();
});
