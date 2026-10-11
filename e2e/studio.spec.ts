import { expect, test, type Page } from "@playwright/test";

import { SEED_USERS, seedToken } from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const KEY_PAUSE_MS = 250;

let teacherToken: string;

test.beforeAll(async () => {
  await resetRateLimits();
  teacherToken = await seedToken(SEED_USERS.scratchTeacher);
});

async function createDraft(page: Page, title: string): Promise<void> {
  await page.goto("/studio/courses/new");
  await page.getByLabel("Title").fill(title);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Programming" }).click();
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(page).toHaveURL(/\/studio\/courses\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function addModule(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "Add module" }).click();
  await page.getByRole("textbox", { name: "Module title" }).fill(title);
  await page.getByRole("button", { name: "Add module" }).last().click();
  await expect(page.getByRole("heading", { name: new RegExp(`\\d+\\. ${title}`) })).toBeVisible();
}

async function addArticleLesson(page: Page, moduleTitle: string, title: string): Promise<void> {
  await page.getByRole("button", { name: `Add lesson to ${moduleTitle}` }).click();
  await page.getByLabel("Lesson title").fill(title);
  await page.getByLabel("Article").check();
  await page.getByRole("button", { name: "Add lesson", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
}

async function lessonOrder(page: Page, moduleTitle: string): Promise<string[]> {
  const list = page.getByRole("list", { name: `Lessons in ${moduleTitle}` });
  return list.getByRole("link").allTextContents();
}

async function moveByKeyboard(page: Page, handleName: string, key: string): Promise<void> {
  const handle = page.getByRole("button", { name: handleName });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(KEY_PAUSE_MS);
  await page.keyboard.press(key);
  await page.waitForTimeout(KEY_PAUSE_MS);
  await page.keyboard.press("Space");
}

test("a teacher builds a course, reorders by keyboard, publishes it and archives it", async ({
  page,
}) => {
  await useToken(page, teacherToken);
  const title = `E2E studio ${Date.now()}`;
  await createDraft(page, title);

  await page.getByRole("button", { name: "Publish course" }).click();
  await expect(page.getByText(/Add at least one lesson before publishing/)).toBeVisible();

  await addModule(page, "Basics");
  await addModule(page, "Advanced");
  await addArticleLesson(page, "Basics", "First lesson");
  await addArticleLesson(page, "Basics", "Second lesson");
  expect(await lessonOrder(page, "Basics")).toEqual(["First lesson", "Second lesson"]);

  await moveByKeyboard(page, "Reorder lesson Second lesson", "ArrowUp");
  await expect.poll(() => lessonOrder(page, "Basics")).toEqual(["Second lesson", "First lesson"]);

  await moveByKeyboard(page, "Reorder module Advanced", "ArrowUp");
  await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText("1. Advanced");

  await page.reload();
  await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText("1. Advanced");
  expect(await lessonOrder(page, "Basics")).toEqual(["Second lesson", "First lesson"]);

  await page.getByRole("button", { name: /^Rename Basics/ }).click();
  await page.getByRole("textbox", { name: "Module title" }).fill("Fundamentals");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "2. Fundamentals" })).toBeVisible();

  await page.getByRole("link", { name: "Second lesson" }).click();
  await page.getByLabel("Description").fill("Why the order of lessons matters.");
  await page.getByRole("switch", { name: /Free preview/ }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Lesson saved.")).toBeVisible();
  await expect(page.getByText("Free preview", { exact: true }).first()).toBeVisible();

  await page.getByLabel("Title").first().fill("Second lesson edited");
  await page.getByRole("link", { name: "First lesson" }).click();
  const discard = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Title").first()).toHaveValue("Second lesson edited");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Lesson saved.")).toBeVisible();

  await page.getByRole("button", { name: "Publish course" }).click();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish course" })).toHaveCount(0);

  await page.goto(`/courses?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("link", { name: title }).first().click();
  await expect(page.getByRole("link", { name: "Edit in studio" })).toBeVisible();
  await page.getByRole("link", { name: "Edit in studio" }).click();
  await page.getByRole("button", { name: "Archive course" }).click();
  await page
    .getByRole("alertdialog", { name: "Archive this course?" })
    .getByRole("button", { name: "Archive course" })
    .click();
  await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();

  await page.goto(`/courses?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole("heading", { name: "No courses match your filters" })).toBeVisible();
});

test("destructive actions ask for confirmation: lessons, modules and drafts", async ({ page }) => {
  await useToken(page, teacherToken);
  const title = `E2E delete ${Date.now()}`;
  await createDraft(page, title);
  await addModule(page, "Temporary");
  await addArticleLesson(page, "Temporary", "Short-lived lesson");

  await page.getByRole("button", { name: "Delete lesson" }).click();
  const lessonDialog = page.getByRole("alertdialog", { name: "Delete this lesson?" });
  await lessonDialog.getByRole("button", { name: "Keep lesson" }).click();
  await expect(page.getByRole("link", { name: "Short-lived lesson" })).toBeVisible();
  await page.getByRole("button", { name: "Delete lesson" }).click();
  await lessonDialog.getByRole("button", { name: "Delete lesson" }).click();
  await expect(page.getByRole("link", { name: "Short-lived lesson" })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete module Temporary" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete this module?" })
    .getByRole("button", { name: "Delete module" })
    .click();
  await expect(page.getByText("No modules yet")).toBeVisible();

  await page.getByRole("button", { name: "Delete draft" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete this draft?" })
    .getByRole("button", { name: "Delete course" })
    .click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});

test("the settings tab saves course details", async ({ page }) => {
  await useToken(page, teacherToken);
  const title = `E2E settings ${Date.now()}`;
  await createDraft(page, title);
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByLabel("Price in USD").fill("19.50");
  await page.getByLabel("Description").fill("Edited from the settings tab.");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Course details saved.")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByLabel("Price in USD")).toHaveValue("19.50");

  await page.getByRole("button", { name: "Delete draft" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete this draft?" })
    .getByRole("button", { name: "Delete course" })
    .click();
  await expect(page).toHaveURL(/\/studio$/);
});

test("a student cannot open the studio and a visitor is asked to sign in", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fstudio$/);

  const studentToken = await seedToken(SEED_USERS.student);
  await useToken(page, studentToken);
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "You do not have access to this page" }),
  ).toBeVisible();
});
