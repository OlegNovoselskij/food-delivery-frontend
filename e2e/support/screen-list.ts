import { SEED_USERS, seedToken } from "./api";
import type { ScreenSpec } from "./screens";

const REGISTER_URL = "**/api/v1/auth/register";
const COURSES_URL = "**/api/v1/courses?*";
const API_URL = "http://localhost:8000/api/v1";

const FASTAPI_COURSE_ID = 2;
const PYTHON_COURSE_ID = 1;

async function certificateNumber(): Promise<string> {
  const token = await seedToken(SEED_USERS.student);
  const response = await fetch(`${API_URL}/certificates/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const certificates = (await response.json()) as { certificate_number: string }[];
  const first = certificates[0];
  if (first === undefined) throw new Error("The seed student has no certificate");
  return first.certificate_number;
}

export const SCREENS: readonly ScreenSpec[] = [
  { name: "not-found", path: "/no/such/page" },
  { name: "forbidden", path: "/403" },
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
  {
    name: "sign-up-code",
    path: "/sign-up",
    prepare: async (page) => {
      await page.route(REGISTER_URL, (route) =>
        route.fulfill({ status: 202, json: { message: "sent" } }),
      );
      await page.getByLabel("First name").fill("Andrii");
      await page.getByLabel("Last name").fill("Kovalenko");
      await page.getByLabel("Email").fill("andrii@demo.example.com");
      await page.getByRole("button", { name: "Send confirmation code" }).click();
      await page.getByRole("heading", { name: "Check your email" }).waitFor();
      await page.getByRole("textbox", { name: "Digit 1 of 6" }).click();
      await page.keyboard.type("4718");
    },
  },
  { name: "forgot-password", path: "/forgot-password" },
  { name: "reset-password", path: "/reset-password?email=andrii%40demo.example.com" },
  { name: "profile", path: "/profile", signedInAs: SEED_USERS.student },
  {
    name: "catalog",
    path: "/courses",
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-signed-in",
    path: "/courses",
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-filtered",
    path: "/courses?category=1&sort=price_desc",
    waitFor: (page) => page.getByRole("link", { name: /^View course/ }).first(),
  },
  {
    name: "catalog-empty",
    path: "/courses?q=zzzznothing",
    waitFor: (page) => page.getByRole("heading", { name: "No courses match your filters" }),
  },
  {
    name: "catalog-loading",
    path: "/courses",
    intercept: async (page) => {
      await page.route(COURSES_URL, () => new Promise<void>(() => undefined));
    },
    waitFor: (page) => page.getByRole("status", { name: "Loading courses" }),
  },
  {
    name: "catalog-error",
    path: "/courses",
    intercept: async (page) => {
      await page.route(COURSES_URL, (route) =>
        route.fulfill({
          status: 500,
          json: { detail: "Internal server error", request_id: "9f3a1c" },
        }),
      );
    },
    waitFor: (page) => page.getByRole("button", { name: "Try again" }),
  },
  {
    name: "catalog-pagination",
    path: "/courses?page=2",
    intercept: async (page) => {
      await page.route(COURSES_URL, async (route) => {
        const response = await route.fetch({
          url: route.request().url().replace("page=2", "page=1"),
        });
        const body = (await response.json()) as Record<string, unknown>;
        await route.fulfill({ response, json: { ...body, total: 40, page: 2 } });
      });
    },
    waitFor: (page) => page.getByRole("navigation", { name: "Pagination" }),
  },
  {
    name: "course-visitor",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    waitFor: (page) => page.getByRole("link", { name: "Enroll in course" }),
  },
  {
    name: "course-student",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    signedInAs: SEED_USERS.student,
    waitFor: (page) => page.getByRole("link", { name: "Continue learning" }),
  },
  {
    name: "course-owner",
    path: `/courses/${FASTAPI_COURSE_ID}`,
    signedInAs: SEED_USERS.teacher,
    waitFor: (page) => page.getByRole("link", { name: "Edit in studio" }),
  },
  {
    name: "course-free",
    path: `/courses/${PYTHON_COURSE_ID}`,
    signedInAs: SEED_USERS.admin,
    waitFor: (page) => page.getByRole("button", { name: "Enroll for free" }),
  },
  {
    name: "course-reviews",
    path: `/courses/${PYTHON_COURSE_ID}?tab=reviews`,
    waitFor: (page) => page.getByText("Based on"),
  },
  {
    name: "course-not-found",
    path: "/courses/999999",
    waitFor: (page) => page.getByRole("heading", { name: "Course not found" }),
  },
  {
    name: "certificate-valid",
    path: async () => `/certificates/verify/${await certificateNumber()}`,
    waitFor: (page) => page.getByRole("heading", { name: "Valid certificate" }),
  },
  {
    name: "certificate-invalid",
    path: "/certificates/verify/CERT-0000-NOPE",
    waitFor: (page) => page.getByRole("heading", { name: "Certificate not found" }),
  },
];
