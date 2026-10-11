import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "@playwright/test";

import { SEED_USERS, seedToken } from "./api";

const API_URL = "http://localhost:8000/api/v1";
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 360;
const RECORD_MS = 3000;
const WEBM_TYPE = "video/webm";

const MOVING_PAGE = `
<style>
  body { margin: 0; height: 100vh; display: grid; place-items: center; color: white;
    font: 700 44px sans-serif; background: linear-gradient(135deg, #14172b, #3b47e0); }
  .dot { width: 60px; height: 60px; border-radius: 50%; background: #f2b01e;
    animation: slide 1.5s linear infinite alternate; }
  @keyframes slide { from { transform: translateX(-180px); } to { transform: translateX(180px); } }
</style>
<div>Atrium lesson</div><div class="dot"></div>`;

let recorded: string | null = null;

export async function recordTestVideo(): Promise<string> {
  if (recorded !== null) return recorded;
  const directory = mkdtempSync(join(tmpdir(), "atrium-video-"));
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
    recordVideo: { dir: directory, size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } },
  });
  const page = await context.newPage();
  await page.setContent(MOVING_PAGE);
  await page.waitForTimeout(RECORD_MS);
  const video = page.video();
  await context.close();
  const path = (await video?.path()) ?? "";
  await browser.close();
  if (path === "") throw new Error("Playwright did not record a test video");
  recorded = path;
  return path;
}

interface UploadInstructions {
  upload_url: string;
  headers: Record<string, string>;
  upload_ticket: string;
}

async function authorizedJson(
  path: string,
  token: string,
  method: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function uploadLessonVideo(token: string, lessonId: number, filePath: string): Promise<void> {
  const size = statSync(filePath).size;
  const instructionsResponse = await authorizedJson(
    `/lessons/${lessonId}/video/upload-url`,
    token,
    "POST",
    { filename: "test-lesson.webm", content_type: WEBM_TYPE, size },
  );
  if (!instructionsResponse.ok) {
    throw new Error(`Upload URL failed: ${instructionsResponse.status}`);
  }
  const instructions = (await instructionsResponse.json()) as UploadInstructions;
  const put = await fetch(instructions.upload_url, {
    method: "PUT",
    headers: instructions.headers,
    body: readFileSync(filePath),
  });
  if (!put.ok) throw new Error(`Storage upload failed: ${put.status}`);
  const confirmed = await authorizedJson(`/lessons/${lessonId}/video/confirm`, token, "POST", {
    upload_ticket: instructions.upload_ticket,
  });
  if (!confirmed.ok) throw new Error(`Confirm failed: ${confirmed.status}`);
}

interface ProgramResponse {
  modules: { lessons: { id: number; has_video: boolean }[] }[];
}

export async function ensureSeedVideos(
  courseId: number,
  lessonIds: readonly number[],
): Promise<void> {
  const response = await fetch(`${API_URL}/courses/${courseId}/program`);
  const program = (await response.json()) as ProgramResponse;
  const missing = lessonIds.filter((lessonId) =>
    program.modules.some((module) =>
      module.lessons.some((lesson) => lesson.id === lessonId && !lesson.has_video),
    ),
  );
  if (missing.length === 0) return;
  const token = await seedToken(SEED_USERS.teacher);
  const file = await recordTestVideo();
  for (const lessonId of missing) await uploadLessonVideo(token, lessonId, file);
}
