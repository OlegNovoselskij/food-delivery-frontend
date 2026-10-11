import { expect, test, type Page } from "@playwright/test";

import { createStudent, type TestUser } from "./support/api";
import { useToken } from "./support/session";

let student: TestUser;

test.beforeAll(async () => {
  student = await createStudent("e2e-enroll");
});

const FREE_COURSE_ID = 3;
const PAID_COURSE_ID = 5;
const PAID_COURSE_TITLE = "Data Analysis with Pandas";
const PAID_PRICE_LABEL = "Pay $59.00";

async function payWithCard(page: Page, number: string): Promise<void> {
  await page.getByLabel("Card number").fill(number);
  await page.getByLabel("Expiry").fill("1299");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: PAID_PRICE_LABEL }).click();
}

test("a student enrolls in a free course and it becomes available instantly", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(`/courses/${FREE_COURSE_ID}`);
  await page.getByRole("button", { name: "Enroll for free" }).click();
  await expect(page.getByRole("link", { name: "Continue learning" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enroll for free" })).toHaveCount(0);

  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "UI Design Fundamentals" })).toBeVisible();
  await expect(page.getByText("In progress")).toBeVisible();
});

test("a paid course goes through a declined payment, a successful payment and a refunded cancellation", async ({
  page,
}) => {
  await useToken(page, student.token);
  await page.goto(`/courses/${PAID_COURSE_ID}`);

  await page.getByRole("button", { name: "Enroll in course" }).click();
  const dialog = page.getByRole("dialog", { name: "Complete your payment" });
  await expect(dialog).toBeVisible();

  await payWithCard(page, "4000000000000002");
  await expect(dialog.getByText("Payment was declined")).toBeVisible();

  await dialog.getByLabel("Card number").fill("4242424242424242");
  await dialog.getByRole("button", { name: PAID_PRICE_LABEL }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Continue learning" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Continue learning" })).toBeVisible();

  await page.goto("/learning");
  const row = page.locator("article", { hasText: PAID_COURSE_TITLE });
  await row.getByRole("button", { name: "Cancel enrollment" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Cancel enrollment?" });
  await expect(confirmation.getByText(/Your payment will be refunded/)).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel enrollment" }).click();
  await expect(row.getByText("Cancelled")).toBeVisible();
  await expect(row.getByRole("link", { name: "Enroll again" })).toBeVisible();

  await page.goto(`/courses/${PAID_COURSE_ID}`);
  await expect(page.getByRole("button", { name: "Enroll in course" })).toBeVisible();
});

test("a pending payment can be resumed later and cancelled", async ({ page }) => {
  await useToken(page, student.token);
  await page.goto(`/courses/${PAID_COURSE_ID}`);
  await page.getByRole("button", { name: "Enroll in course" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("button", { name: "Pay now" })).toBeVisible();

  await page.goto("/learning");
  const row = page.locator("article", { hasText: PAID_COURSE_TITLE });
  await expect(row.getByText("Awaiting payment")).toBeVisible();
  await row.getByRole("button", { name: "Cancel enrollment" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel enrollment" }).click();
  await expect(row.getByText("Cancelled")).toBeVisible();
});
