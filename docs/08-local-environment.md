# 08. Local environment

Everything runs on the developer's machine with Docker. The backend project is in `../backend` (if the folder has another name, locate the sibling project that contains `docker-compose.yml` and `app/main.py`, and use that). Read `../backend/README.md` and `../backend/.env.example` first; they are authoritative for variable names and commands.

## Start the backend

```bash
cd ../backend
cp .env.example .env            # only if .env does not exist; never overwrite an existing .env
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed_demo
curl -s http://localhost:8000/health/ready
```

If `seed_demo` reports that data already exists, that is fine. To reset the demo data only, ask the backend script for its reset option (see the script); do not run `docker compose down -v` (it is denied in settings and would destroy the database volume).

| Service | URL | Purpose |
|---|---|---|
| Backend API | `http://localhost:8000` (`/docs`, `/openapi.json`) | REST and WebSocket |
| Backend admin | `http://localhost:8000/admin` | SQLAdmin panel |
| Mailpit | `http://localhost:8025` | Catches all e-mails; read OTP codes here, or via `GET /api/v1/messages` |
| RustFS (S3) | `http://localhost:9000` (console `http://localhost:9001`) | Video and file storage |
| Postgres | internal to Docker | |
| Valkey | internal to Docker | Pub/Sub, caches, rate limits |

The backend uses `--reload` with a bind mount, so small backend fixes take effect immediately. After a model change you need a migration (see `09-backend-change-rules.md`).

## Reading a sign-up code in tests and by hand

Mailpit exposes a JSON API: `curl -s http://localhost:8025/api/v1/messages` lists messages, `curl -s http://localhost:8025/api/v1/message/<ID>` returns one with `Text`. The six-digit code is in the text body. In Playwright, poll this endpoint for the newest message to the test address and extract `\b\d{6}\b`.

## Storage CORS (needed for browser uploads)

The browser PUTs videos straight to RustFS, so the bucket must allow the dev origin. If an upload fails in the browser with a CORS error while `curl` works, add a rule: allowed origin `http://localhost:5173`, methods `GET`, `PUT`, `HEAD`, headers `*`, exposed header `ETag`. Check `../backend/README.md` and `app/storage.py` for how the bucket, credentials (`S3_*` variables) and any CORS helper are set up; apply the rule with `boto3` from inside the backend container, or with the RustFS console. Record what you did in `docs/DECISIONS.md`.

## Frontend dev server

`.env.local` (git-ignored) with `VITE_API_URL=http://localhost:8000` and optionally `VITE_GOOGLE_CLIENT_ID`. `npm run dev` serves `http://localhost:5173`, the only origin the backend CORS allows by default. If you need another port, change `ALLOWED_ORIGINS` in `../backend/.env` and restart the backend; log it in `BACKEND_CHANGES.md`.

## Google sign-in (optional)

Works only if `GOOGLE_CLIENT_ID` is set in `../backend/.env` and the same id is in `VITE_GOOGLE_CLIENT_ID`, and `http://localhost:5173` is an authorised JavaScript origin of that OAuth client. Without it, skip Google (the button must be hidden) and verify everything else. Do not create Google credentials yourself.

## Test data

Run e2e against the seed data. For flows that need a fresh student (sign-up), use unique e-mails like `e2e+<timestamp>@demo.test`. Rate limits are per IP and per user; if a test run hits 429, wait for `Retry-After` or restart the Valkey container (`docker compose restart valkey`), which clears limits without touching the database.

## Typical problems

| Symptom | Cause and fix |
|---|---|
| `Failed to fetch` in the browser | Backend not running, wrong `VITE_API_URL`, or origin not in `ALLOWED_ORIGINS` |
| Upload PUT fails with 403 `SignatureDoesNotMatch` | Extra or missing headers; send exactly the returned `headers`, no `Authorization` |
| Upload PUT fails with CORS error | Bucket CORS rule missing |
| Video plays then stops | Presigned URL expired; request a new one |
| WebSocket closes immediately | Ticket reused or expired; request a fresh ticket per connection |
| 429 everywhere | Rate limits; wait or restart Valkey |
| Types out of date | Run `npm run api:types` after any backend change |
