import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const READY_URL = "http://localhost:8000/health/ready";
const BACKEND_COMPOSE_FILE = resolve(
  process.cwd(),
  "..",
  "food-delivery-backend",
  "docker-compose.yml",
);
const READY_RETRIES = 40;
const READY_DELAY_MS = 500;

const run = promisify(execFile);

export async function isBackendReady(): Promise<boolean> {
  const response = await fetch(READY_URL).catch(() => null);
  return response?.ok === true;
}

export async function resetRateLimits(): Promise<void> {
  if (process.env.E2E_KEEP_RATE_LIMITS !== undefined) return;
  await run("docker", ["compose", "-f", BACKEND_COMPOSE_FILE, "restart", "valkey"]).catch(
    (error: unknown) => {
      process.stderr.write(`Could not reset rate limits: ${String(error)}\n`);
    },
  );
  for (let attempt = 0; attempt < READY_RETRIES; attempt += 1) {
    if (await isBackendReady()) return;
    await new Promise((done) => setTimeout(done, READY_DELAY_MS));
  }
}

export async function restartBackend(): Promise<void> {
  await run("docker", ["compose", "-f", BACKEND_COMPOSE_FILE, "restart", "backend"]);
  for (let attempt = 0; attempt < READY_RETRIES; attempt += 1) {
    if (await isBackendReady()) return;
    await new Promise((done) => setTimeout(done, READY_DELAY_MS));
  }
  throw new Error("The backend did not become ready after the restart");
}
