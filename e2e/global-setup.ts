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
const READY_RETRIES = 30;
const READY_DELAY_MS = 500;

const run = promisify(execFile);

async function isReady(): Promise<boolean> {
  const response = await fetch(READY_URL).catch(() => null);
  return response?.ok === true;
}

async function resetRateLimits(): Promise<void> {
  await run("docker", ["compose", "-f", BACKEND_COMPOSE_FILE, "restart", "valkey"]).catch(
    (error: unknown) => {
      process.stderr.write(`Could not reset rate limits: ${String(error)}
`);
    },
  );
  for (let attempt = 0; attempt < READY_RETRIES; attempt += 1) {
    if (await isReady()) return;
    await new Promise((done) => setTimeout(done, READY_DELAY_MS));
  }
}

export default async function globalSetup(): Promise<void> {
  if (!(await isReady())) {
    throw new Error(
      `The backend is not ready at ${READY_URL}. Start it with "docker compose up -d" in the backend folder, run the migrations and load the demo data (see docs/08-local-environment.md).`,
    );
  }
  if (process.env.E2E_KEEP_RATE_LIMITS === undefined) await resetRateLimits();
}
