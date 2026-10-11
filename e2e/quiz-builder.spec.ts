import { expect, test, type Page } from "@playwright/test";

import { createDraftCourse, deleteDraftCourse, type DraftCourse } from "./support/courses";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

const KEY_PAUSE_MS = 250;

let draft: DraftCourse;

test.beforeAll(async () => {
  await resetRateLimits();
  draft = await createDraftCourse(true);
});

test.afterAll(async () => {
  await deleteDraftCourse(draft);
});

async function moveByKeyboard(page: Page, handleName: string, key: string): Promise<void> {
  await page.getByRole("button", { name: handleName }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(KEY_PAUSE_MS);
  await page.keyboard.press(key);
  await page.waitForTimeout(KEY_PAUSE_MS);
  await page.keyboard.press("Space");
}

async function questionTexts(page: Page): Promise<string[]> {
  const items = page.getByRole("list", { name: "Questions" }).locator("> li");
  const paragraphs = items.locator("p.font-semibold");
  return paragraphs.allTextContents();
}

async function addChoiceQuestion(
  page: Page,
  text: string,
  options: string[],
  correct: number[],
  multiple: boolean,
): Promise<void> {
  const form = page.getByRole("region", { name: "New question" });
  await form.getByLabel("Question", { exact: true }).fill(text);
  if (multiple) await form.getByRole("radio", { name: /Multiple choice/ }).click();
  for (let index = 0; index < options.length; index += 1) {
    if (index >= 2) await form.getByRole("button", { name: "Add option" }).click();
    await form.getByLabel(`Option ${index + 1} text`).fill(options[index] ?? "");
  }
  for (const index of correct) await form.getByLabel(`Option ${index + 1} is correct`).check();
  await form.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Question added.").first()).toBeVisible();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
}

test("a teacher builds a quiz with every question type, reorders, edits and deletes", async ({
  page,
}) => {
  await useToken(page, draft.token);
  await page.goto(`/studio/courses/${draft.courseId}`);
  await page.getByRole("button", { name: /^Add quiz/ }).click();

  await expect(page).toHaveURL(/\/quizzes\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: "Module quiz" })).toBeVisible();
  await expect(page.getByText("No questions yet")).toBeVisible();

  await page.getByLabel("Quiz title").fill("Fundamentals check");
  await page.getByLabel("Passing score, %").fill("70");
  await page.getByLabel("Attempts allowed").fill("3");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Quiz settings saved.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Fundamentals check" })).toBeVisible();

  await page.getByRole("button", { name: "Add question" }).click();
  const form = page.getByRole("region", { name: "New question" });
  await form.getByLabel("Question", { exact: true }).fill("Which keyword declares a constant?");
  await form.getByLabel("Option 1 text").fill("const");
  await form.getByLabel("Option 2 text").fill("var");
  await form.getByRole("button", { name: "Add question" }).click();
  await expect(form.getByText("Mark exactly one option as correct")).toBeVisible();
  await form.getByLabel("Option 1 is correct").check();
  await form.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Question added.").first()).toBeVisible();

  await page.getByRole("button", { name: "Add question" }).click();
  await addChoiceQuestion(page, "Which are loops?", ["for", "while", "if"], [0, 1], true);

  await page.getByRole("button", { name: "Add question" }).click();
  const openForm = page.getByRole("region", { name: "New question" });
  await openForm.getByLabel("Question", { exact: true }).fill("Explain closures");
  await openForm.getByRole("radio", { name: /Open answer/ }).click();
  await openForm.getByLabel("Points").fill("5");
  await openForm.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Explain closures", { exact: true })).toBeVisible();

  await expect(page.getByText("3 questions · 7 points")).toBeVisible();
  expect(await questionTexts(page)).toEqual([
    "Which keyword declares a constant?",
    "Which are loops?",
    "Explain closures",
  ]);

  await moveByKeyboard(page, "Reorder question 3", "ArrowUp");
  await expect
    .poll(() => questionTexts(page))
    .toEqual(["Which keyword declares a constant?", "Explain closures", "Which are loops?"]);

  await page.reload();
  await expect
    .poll(() => questionTexts(page))
    .toEqual(["Which keyword declares a constant?", "Explain closures", "Which are loops?"]);

  await page.getByRole("button", { name: "Edit question 1" }).click();
  await page
    .getByLabel("Question", { exact: true })
    .fill("Which keyword declares a constant in JavaScript?");
  await page.getByLabel("Option 2 is correct").check();
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Question saved.")).toBeVisible();
  const first = page.getByRole("list", { name: "Options for question 1" });
  await expect(first.getByText("Correct:")).toHaveCount(1);
  await expect(first.getByText("var")).toBeVisible();

  await page.getByRole("button", { name: "Delete question 2" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete this question?" })
    .getByRole("button", { name: "Delete question" })
    .click();
  await expect(page.getByText("Question deleted.")).toBeVisible();
  await expect(page.getByText("Explain closures", { exact: true })).toHaveCount(0);
  await expect(page.getByText("2 questions · 2 points")).toBeVisible();

  await page.getByRole("link", { name: "Back to the course" }).click();
  await expect(page.getByText("Quiz · 2 questions")).toBeVisible();
  await page.getByRole("link", { name: "Module quiz" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Fundamentals check" })).toBeVisible();

  await page.getByRole("button", { name: "Delete quiz" }).click();
  await page
    .getByRole("alertdialog", { name: "Delete this quiz?" })
    .getByRole("button", { name: "Delete quiz" })
    .click();
  await expect(page.getByText("Quiz deleted.")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/studio/courses/${draft.courseId}$`));
  await expect(page.getByRole("button", { name: /^Add quiz/ })).toBeVisible();
});
