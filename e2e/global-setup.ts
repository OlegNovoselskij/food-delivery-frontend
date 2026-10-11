import { isBackendReady, resetRateLimits } from "./support/rate-limits";

const READY_URL = "http://localhost:8000/health/ready";

export default async function globalSetup(): Promise<void> {
  if (!(await isBackendReady())) {
    throw new Error(
      `The backend is not ready at ${READY_URL}. Start it with "docker compose up -d" in the backend folder, run the migrations and load the demo data (see docs/08-local-environment.md).`,
    );
  }
  await resetRateLimits();
}
