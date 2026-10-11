import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  archivePublishedCourse,
  createCourseWithVideoLesson,
  type VideoLessonCourse,
} from "./support/courses";
import { recordTestVideo } from "./support/media";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

let course: VideoLessonCourse;
let videoPath: string;
let notesPath: string;
let wrongPath: string;
let published = false;

test.beforeAll(async () => {
  await resetRateLimits();
  course = await createCourseWithVideoLesson();
  videoPath = await recordTestVideo();
  const directory = mkdtempSync(join(tmpdir(), "atrium-files-"));
  notesPath = join(directory, "lesson-notes.txt");
  wrongPath = join(directory, "slides.exe");
  writeFileSync(notesPath, "Notes for the lesson.\n");
  writeFileSync(wrongPath, "not allowed");
});

test.afterAll(async () => {
  if (published) await archivePublishedCourse(course.courseId, course.token);
});

test("a teacher uploads a video with progress, replaces and removes it, and students can play it", async ({
  page,
}) => {
  await useToken(page, course.token);
  await page.goto(`/studio/courses/${course.courseId}/lessons/${course.lessonId}`);
  await expect(page.getByRole("heading", { level: 2, name: "Upload me" })).toBeVisible();
  await expect(page.getByText("No video").first()).toBeVisible();

  await page.getByLabel("Upload a video").setInputFiles(wrongPath);
  await expect(
    page.getByRole("alert").filter({ hasText: "file type is not supported" }),
  ).toBeVisible();

  await page.getByLabel("Upload a video").setInputFiles(videoPath);
  await expect(page.getByText("Video uploaded. Students can play it now.")).toBeVisible();
  await expect(page.getByText("Video ready").first()).toBeVisible();

  await page.getByLabel("Add a file").setInputFiles(notesPath);
  await expect(page.getByText("File added to the lesson.")).toBeVisible();
  await expect(page.getByText("lesson notes", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Replace video" }).click();
  await page.getByLabel("Upload a replacement video").setInputFiles(videoPath);
  await expect(page.getByText("Video uploaded. Students can play it now.")).toBeVisible();

  await page.getByRole("button", { name: "Publish course" }).click();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
  published = true;

  const visitor = await page.context().browser()?.newContext();
  if (!visitor) throw new Error("No browser");
  const visitorPage = await visitor.newPage();
  await visitorPage.goto(`/learning/courses/${course.courseId}/lessons/${course.lessonId}`);
  await expect(visitorPage.locator("video")).toBeVisible();
  await expect
    .poll(() => visitorPage.evaluate(() => document.querySelector("video")?.readyState ?? 0))
    .toBeGreaterThanOrEqual(2);
  await expect(visitorPage.getByText("Notes for the lesson.")).toHaveCount(0);
  await visitor.close();

  await page.getByRole("button", { name: "Remove video" }).click();
  await page
    .getByRole("alertdialog", { name: "Remove this video?" })
    .getByRole("button", { name: "Remove video" })
    .click();
  await expect(page.getByText("Video removed.")).toBeVisible();
  await expect(page.getByLabel("Upload a video")).toBeAttached();

  await page.getByRole("button", { name: "Remove lesson notes" }).click();
  await page
    .getByRole("alertdialog", { name: "Remove this file?" })
    .getByRole("button", { name: "Remove file" })
    .click();
  await expect(page.getByText("File removed.")).toBeVisible();
});
