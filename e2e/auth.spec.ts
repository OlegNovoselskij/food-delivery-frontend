import { expect, test, type Page } from "@playwright/test";

import {
  SEED_PASSWORD,
  SEED_USERS,
  createStudent,
  statusWithToken,
  uniqueEmail,
} from "./support/api";
import { knownMessageIds, waitForCode } from "./support/mailpit";

async function enterCode(page: Page, code: string): Promise<void> {
  await page.getByRole("textbox", { name: "Digit 1 of 6" }).click();
  await page.keyboard.type(code);
}

async function submitSignIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await submitSignIn(page, email, password);
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
}

test("a new student signs up with the emailed code and stays signed in after reload", async ({
  page,
}) => {
  const email = uniqueEmail("e2e-signup");
  const known = await knownMessageIds(email);

  await page.goto("/sign-up");
  await page.getByLabel("First name").fill("Maria");
  await page.getByLabel("Last name").fill("Petrenko");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send confirmation code" }).click();

  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await enterCode(page, "000000");
  await page.getByLabel("Create a password").fill("Fresh-pass-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("The code is invalid or has expired")).toBeVisible();

  const code = await waitForCode(email, known);
  await page.getByRole("textbox", { name: "Digit 6 of 6" }).click();
  for (let index = 0; index < 6; index += 1) await page.keyboard.press("Backspace");
  await enterCode(page, code);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("atrium.token"))).toBeNull();
});

test("a wrong password shows the server message and stays on the page", async ({ page }) => {
  await submitSignIn(page, SEED_USERS.student, "not-the-password");
  await expect(page.getByText("Incorrect email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("a protected page sends a visitor to sign in and back", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fprofile$/);
  await page.getByLabel("Email").fill(SEED_USERS.student);
  await page.getByLabel("Password", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
});

test("a student can edit the profile", async ({ page }) => {
  const student = await createStudent("e2e-profile");
  await signIn(page, student.email, student.password);
  await page.goto("/profile");
  await page.getByLabel("About you").fill("I build typed APIs.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("About you")).toHaveValue("I build typed APIs.");
});

test("forgot password resets the password and signs out every old session", async ({ page }) => {
  const student = await createStudent("e2e-reset");
  const known = await knownMessageIds(student.email);
  const newPassword = "Brand-new-pass-456";

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(student.email);
  await page.getByRole("button", { name: "Send reset code" }).click();
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();

  const code = await waitForCode(student.email, known);
  await enterCode(page, code);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();

  expect(await statusWithToken("/users/me", student.token)).toBe(401);

  await signIn(page, student.email, newPassword);
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
});

test("a student is blocked from pages of other roles", async ({ page }) => {
  await signIn(page, SEED_USERS.student, SEED_PASSWORD);
  await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
  await page.goto("/403");
  await expect(
    page.getByRole("heading", { name: "You do not have access to this page" }),
  ).toBeVisible();
});
