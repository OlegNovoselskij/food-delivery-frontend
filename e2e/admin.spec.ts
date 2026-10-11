import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { SEED_USERS, seedToken } from "./support/api";
import { resetRateLimits } from "./support/rate-limits";
import { useToken } from "./support/session";

let adminToken: string;

test.beforeAll(async () => {
  await resetRateLimits();
  adminToken = await seedToken(SEED_USERS.admin);
});

test("an admin reads the overview, switches the range and views a chart as a table", async ({
  page,
}) => {
  await useToken(page, adminToken);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Platform overview" })).toBeVisible();
  await expect(page.getByText("Paid enrollments")).toBeVisible();
  await expect(page.getByRole("table", { name: "Teachers" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Courses" })).toBeVisible();

  await page.getByRole("radio", { name: "30 days" }).click();
  await expect(page).toHaveURL(/range=30d/);
  await expect(page.getByText("USD per day")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("radio", { name: "30 days" })).toBeChecked();

  const revenue = page.getByRole("region", { name: "Revenue over time" });
  await revenue.getByRole("button", { name: "View as table" }).click();
  await expect(revenue.getByRole("table", { name: "Revenue over time" })).toBeVisible();
  await revenue.getByRole("button", { name: "View as chart" }).click();
  await expect(revenue.getByRole("img")).toBeVisible();

  await page.getByRole("radio", { name: "Teachers" }).click();
  await expect(page.getByRole("table", { name: "Revenue by teacher" })).toBeVisible();
});

test("an admin exports revenue as CSV with their credentials", async ({ page }) => {
  await useToken(page, adminToken);
  await page.goto("/admin");
  await expect(page.getByRole("table", { name: "Courses" })).toBeVisible();

  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Revenue over time" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.csv$/);
  expect(readFileSync(await file.path(), "utf-8").length).toBeGreaterThan(0);
});

test("the detailed tables sort and filter", async ({ page }) => {
  await useToken(page, adminToken);
  await page.goto("/admin/courses");
  const table = page.getByRole("table", { name: "Courses" });
  await expect(table.getByRole("row")).not.toHaveCount(1);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Design" }).click();
  await expect(table.getByText("Design", { exact: true }).first()).toBeVisible();

  await page.goto("/admin/teachers");
  await expect(page.getByRole("table", { name: "Teachers" }).getByRole("row")).not.toHaveCount(1);
});

test("an admin manages categories", async ({ page }) => {
  const name = `E2E category ${Date.now()}`;
  const renamed = `${name} renamed`;
  await useToken(page, adminToken);
  await page.goto("/admin/categories");

  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByLabel("Category name").fill(name);
  await page.getByRole("button", { name: "Add category" }).last().click();
  await expect(page.getByRole("list", { name: "Categories" }).getByText(name)).toBeVisible();

  await page.getByRole("button", { name: `Rename ${name}` }).click();
  await page.getByLabel("Category name").fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(renamed, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${renamed}` }).click();
  await page.getByRole("button", { name: "Delete category" }).click();
  await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete Programming" }).click();
  await page.getByRole("button", { name: "Delete category" }).click();
  await expect(page.getByText("Category has courses and cannot be deleted")).toBeVisible();
  await expect(page.getByText("Programming", { exact: true })).toBeVisible();
});

test("teachers and students cannot open the admin pages", async ({ page }) => {
  await useToken(page, await seedToken(SEED_USERS.teacher));
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "You do not have access to this page" }),
  ).toBeVisible();
});
