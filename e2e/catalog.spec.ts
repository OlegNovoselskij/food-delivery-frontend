import { expect, test } from "@playwright/test";

import { SEED_PASSWORD, SEED_USERS, seedToken } from "./support/api";

const TOKEN_KEY = "atrium.token";

test("a visitor filters the catalog, keeps filters across reload and back, and opens a course", async ({
  page,
}) => {
  await page.goto("/courses");
  await expect(page.getByRole("link", { name: /^View course/ }).first()).toBeVisible();

  await page.getByRole("button", { name: "Design" }).click();
  await expect(page).toHaveURL(/\/courses\?category=\d+$/);
  await expect(page.getByRole("heading", { name: "UI Design Fundamentals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "FastAPI in Practice" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Design" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { name: "UI Design Fundamentals" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Search courses" }).fill("figma");
  await expect(page).toHaveURL(/q=figma/);
  await expect(page.getByRole("heading", { name: "Design Systems with Figma" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "UI Design Fundamentals" })).toHaveCount(0);

  await page.goBack();
  await expect(page.getByRole("heading", { name: "UI Design Fundamentals" })).toBeVisible();

  await page.getByRole("link", { name: "UI Design Fundamentals" }).first().click();
  await expect(page).toHaveURL(/\/courses\/3$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "UI Design Fundamentals" }),
  ).toBeVisible();
});

test("the price filter and sort order change the results", async ({ page }) => {
  await page.goto("/courses");
  await page.getByRole("combobox", { name: "Price filter" }).click();
  await page.getByRole("option", { name: "Free only" }).click();
  await expect(page).toHaveURL(/price=free/);
  const titles = page.getByRole("heading", { level: 3 });
  await expect(titles).toHaveCount(2);

  await page.goto("/courses?sort=price_desc");
  await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText(
    "Data Analysis with Pandas",
  );
});

test("a search without matches shows the empty state and clears", async ({ page }) => {
  await page.goto("/courses?q=zzzznothing");
  await expect(page.getByRole("heading", { name: "No courses match your filters" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect(page.getByRole("link", { name: /^View course/ }).first()).toBeVisible();
});

test("enrolling as a visitor goes through sign in and returns to the course", async ({ page }) => {
  await page.goto("/courses/3");
  await page.getByRole("link", { name: "Enroll in course" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fcourses%2F3$/);
  await page.getByLabel("Email").fill(SEED_USERS.student);
  await page.getByLabel("Password", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/courses\/3$/);
  await expect(page.getByRole("button", { name: "Enroll for free" })).toBeVisible();
});

test("the course page shows the right call to action for an enrolled student and the owner", async ({
  browser,
}) => {
  const studentContext = await browser.newContext();
  await studentContext.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [TOKEN_KEY, await seedToken(SEED_USERS.student)] as const,
  );
  const studentPage = await studentContext.newPage();
  await studentPage.goto("/courses/2");
  await expect(studentPage.getByRole("link", { name: "Continue learning" })).toBeVisible();
  await studentContext.close();

  const teacherContext = await browser.newContext();
  await teacherContext.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [TOKEN_KEY, await seedToken(SEED_USERS.teacher)] as const,
  );
  const teacherPage = await teacherContext.newPage();
  await teacherPage.goto("/courses/2");
  await expect(teacherPage.getByRole("link", { name: "Edit in studio" })).toBeVisible();
  await teacherContext.close();
});

test("a course page for a missing course explains it", async ({ page }) => {
  await page.goto("/courses/999999");
  await expect(page.getByRole("heading", { name: "Course not found" })).toBeVisible();
});

test("a certificate can be verified by number and an unknown number is reported", async ({
  page,
}) => {
  const token = await seedToken(SEED_USERS.student);
  const response = await fetch("http://localhost:8000/api/v1/certificates/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const [certificate] = (await response.json()) as { certificate_number: string }[];
  if (certificate === undefined) throw new Error("The seed student has no certificate");

  await page.goto(`/certificates/verify/${certificate.certificate_number}`);
  await expect(page.getByRole("heading", { name: "Valid certificate" })).toBeVisible();
  await expect(page.getByText("Python for Beginners")).toBeVisible();

  await page.getByLabel("Certificate number").fill("CERT-2026-DOESNOTEXIST");
  await page.getByRole("button", { name: "Check certificate" }).click();
  await expect(page.getByRole("heading", { name: "Certificate not found" })).toBeVisible();
});
