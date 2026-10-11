import { expect, test } from "@playwright/test";

import { createStudent, enrollWithToken, payWithToken } from "./support/api";
import { archiveCourse, createQuizCourse, type QuizCourse } from "./support/courses";
import { resetRateLimits, restartBackend } from "./support/rate-limits";
import { useToken } from "./support/session";

const PAID_COURSE_ID = 6;
const RECONNECT_TIMEOUT_MS = 60_000;

let course: QuizCourse;

test.beforeAll(async () => {
  await resetRateLimits();
  course = await createQuizCourse();
});

test.afterAll(async () => {
  await archiveCourse(course);
});

test("completing a course creates a certificate and a live notification, and the PDF downloads", async ({
  page,
}) => {
  const student = await createStudent("e2e-live");
  await enrollWithToken(student.token, course.courseId);
  await useToken(page, student.token);

  await page.goto(`/learning/courses/${course.courseId}/lessons/${course.lessonId}`);
  await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await expect(page.getByText("50% complete")).toBeVisible();

  await page.goto(`/learning/quizzes/${course.quizId}?course=${course.courseId}`);
  await page.getByRole("button", { name: "Start quiz" }).click();
  await page.getByRole("radio", { name: "const" }).check();
  await page.getByRole("checkbox", { name: "string" }).check();
  await page.getByRole("checkbox", { name: "number" }).check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.getByRole("heading", { name: "You passed" })).toBeVisible();

  await expect(page.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible();
  await expect(page.getByText("Congratulations! Your certificate")).toBeVisible();

  await page.getByRole("button", { name: /Notifications, \d+ unread/ }).click();
  const dropdown = page.getByRole("dialog", { name: "Notifications" });
  await expect(dropdown.getByText("Course completed")).toBeVisible();
  await dropdown.getByRole("button", { name: /Course completed/ }).click();
  await expect(page).toHaveURL(/\/certificates\/verify\/CERT-/);
  await expect(page.getByRole("heading", { name: "Valid certificate" })).toBeVisible();
  await expect(page.locator("dd", { hasText: course.title })).toBeVisible();

  await page.goto("/certificates");
  await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
});

test("the live connection survives a backend restart and keeps delivering notifications", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const student = await createStudent("e2e-restart");
  await useToken(page, student.token);
  const tickets: string[] = [];
  let connectedFrames = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/v1/ws/ticket")) tickets.push(request.url());
  });
  page.on("websocket", (socket) => {
    if (!socket.url().includes("/api/v1/ws")) return;
    socket.on("framereceived", (frame) => {
      if (String(frame.payload).includes('"connected"')) connectedFrames += 1;
    });
  });

  await page.goto("/courses");
  await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
  await expect.poll(() => tickets.length).toBeGreaterThanOrEqual(1);
  await expect.poll(() => connectedFrames).toBeGreaterThanOrEqual(1);
  const beforeRestart = tickets.length;

  await restartBackend();
  await expect
    .poll(() => tickets.length, { timeout: RECONNECT_TIMEOUT_MS })
    .toBeGreaterThan(beforeRestart);

  await expect
    .poll(() => connectedFrames, { timeout: RECONNECT_TIMEOUT_MS })
    .toBeGreaterThanOrEqual(2);

  const enrollmentId = await enrollWithToken(student.token, PAID_COURSE_ID);
  await payWithToken(student.token, enrollmentId);
  await expect(page.getByText("Payment received").first()).toBeVisible({
    timeout: RECONNECT_TIMEOUT_MS,
  });
  await expect(page.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible();
});
