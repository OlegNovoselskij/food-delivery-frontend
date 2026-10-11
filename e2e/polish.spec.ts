import { expect, test } from "@playwright/test";

import { SEED_USERS, seedToken } from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

test.beforeAll(async () => {
  await resetRateLimits();
});

test("a student sees recommendations with a reason on the catalog and the dashboard", async ({
  page,
}) => {
  await useToken(page, await seedToken(SEED_USERS.student));
  await page.goto("/courses");
  const section = page.getByRole("region", { name: "Recommended for you" });
  await expect(section.getByRole("listitem").first()).toBeVisible();
  await expect(section.getByRole("link", { name: /^View course/ }).first()).toBeVisible();

  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "Recommended for you" })).toBeVisible();
});

test("visitors get no recommendations", async ({ page }) => {
  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: /Courses taught by people/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recommended for you" })).toHaveCount(0);
});

test("the chosen theme is applied, remembered after a reload and shared with the system option", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/courses");
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("unknown addresses show the not found page with a way back", async ({ page }) => {
  await page.goto("/definitely/not/a/page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go to home page" }).click();
  await expect(page).toHaveURL(/\/courses$/);
});
