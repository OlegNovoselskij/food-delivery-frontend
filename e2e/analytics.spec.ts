import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { SEED_USERS, seedToken } from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const COURSE_ID = 2;

let teacherToken: string;

test.beforeAll(async () => {
  await resetRateLimits();
  teacherToken = await seedToken(SEED_USERS.teacher);
});

test("a teacher reads the course analytics and exports the funnel as CSV", async ({ page }) => {
  await useToken(page, teacherToken);
  await page.goto(`/studio/courses/${COURSE_ID}/analytics`);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const funnel = page.getByRole("region", { name: "Lesson funnel" });
  await expect(funnel.getByRole("progressbar").first()).toBeVisible();
  await expect(funnel.getByText("Biggest drop")).toBeVisible();

  const quizzes = page.getByRole("table", { name: "Quiz results" });
  await expect(quizzes.getByRole("row").nth(1)).toContainText("API fundamentals: checkpoint");

  await expect(page.getByRole("table", { name: "Hardest questions" })).toBeVisible();

  const students = page.getByRole("table", { name: "Students" });
  await expect(students.getByRole("row")).not.toHaveCount(1);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export funnel CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.csv$/);
  const path = await file.path();
  expect(readFileSync(path, "utf-8")).toContain("lesson");
});

test("the students table filters by status and keeps the filter in the address", async ({
  page,
}) => {
  await useToken(page, teacherToken);
  await page.goto(`/studio/courses/${COURSE_ID}/analytics`);
  await expect(page.getByRole("table", { name: "Students" })).toBeVisible();

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Completed" }).click();
  await expect(page).toHaveURL(/status=completed/);
  const rows = page.getByRole("table", { name: "Students" }).locator("tbody tr");
  await expect(rows.first()).toContainText("Completed");

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Status" })).toHaveText("Completed");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/status=/);
});

test("another teacher cannot open this course's analytics", async ({ page }) => {
  await useToken(page, await seedToken(SEED_USERS.cleanTeacher));
  await page.goto(`/studio/courses/${COURSE_ID}/analytics`);
  await expect(page.getByText(/Could not load|not found/i).first()).toBeVisible();
});
