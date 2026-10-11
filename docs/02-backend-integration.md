# 02. Backend integration

The backend (`../backend`) is a FastAPI application. Base URL in development: `http://localhost:8000`. All business endpoints live under `/api/v1`. Interactive docs: `/docs`. Machine-readable contract: `/openapi.json`. **When this document and the OpenAPI schema disagree, the schema and the backend source win.** Read the actual code in `../backend/app/api/v1/*.py`, `app/schemas/*.py` and `app/services/*.py` whenever behaviour is unclear.

## Typed client

1. `npm run api:types` runs `openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts`. Commit the generated file. Regenerate after any backend change.
2. Wrap `openapi-fetch` in `src/api/client.ts`: base URL from `import.meta.env.VITE_API_URL`, `Authorization: Bearer <token>` injected from the auth store, error normalisation into one `ApiError` class (status, `detail`, `requestId`, `retryAfter`), automatic sign-out on 401 for authenticated calls (not for the login call itself).
3. One module per resource in `src/api/` or per feature (`features/courses/api.ts`) exposing typed functions; TanStack Query hooks live next to them. Components never call `fetch` directly.
4. Query keys come from a single key factory per feature. Mutations invalidate precisely.

## Conventions you must honour

| Topic | Rule |
|---|---|
| Money | Prices and amounts are **strings** (decimal, e.g. `"89.00"`). Never parse to float for arithmetic; format with `Intl.NumberFormat` only for display. `"0.00"` means free. |
| Dates | UTC ISO 8601 strings. Convert to the user's locale only when rendering (`date-fns`). |
| Errors | Body is `{"detail": ...}`. `detail` is a string or, for validation (422), an array of `{loc, msg, type}`; map `loc` to form fields. 500 responses also contain `request_id`; show it in the error UI so it can be quoted. |
| Rate limits | 429 with `Retry-After` header and `retry_after` seconds in the body. Disable the control and show a countdown. |
| Auth failures | 401 = missing/invalid/expired token (sign out). 403 = signed in but not allowed (role) or, on lessons, **not enrolled**; handle it as "enroll first", not as a crash. |
| Not found | 404 per resource. Treat the same way for "not yours" cases, the API does not reveal existence. |
| Pagination | Catalog and notifications return `{items, total, page, size}`. Use URL query params `page`, `size`. |
| Caching header | Catalog responses carry `X-Cache: HIT|MISS`. Useful in dev tools only; the catalog is cached server-side and invalidated on course changes. |
| Request id | Every response has `X-Request-ID`. Log it with errors in the client error reporter. |
| CORS | Allowed origin is `http://localhost:5173` in dev (`ALLOWED_ORIGINS` in the backend `.env`). Exposed headers: `X-Request-ID`, `X-Cache`, `Retry-After`, `Content-Disposition`. |
| Optional body | `GET /courses/{id}/reviews/mine` returns `null` when the user has not reviewed; treat as "no review yet". |
| CSV / PDF | `?format=csv` on report endpoints and `GET /certificates/{id}/pdf` need the bearer token, so download via `fetch` as a blob and save with an object URL; read the filename from `Content-Disposition`. |

## Authentication

Accounts are protected by e-mail OTP codes (6 digits, valid 10 minutes, 5 attempts, 60 s resend cooldown). Tokens are JWT bearer tokens.

**Sign up (two steps)**
1. `POST /api/v1/auth/register` with name and e-mail (no password). Responds 202; the backend e-mails a code.
2. `POST /api/v1/auth/verify-email` with e-mail, code and the chosen password. Responds with `{access_token, token_type}`. The user is now signed in. Resend with `POST /api/v1/auth/resend-code`.

**Sign in**: `POST /api/v1/auth/login` with JSON `{email, password}` returns the token. There is no OAuth2 form data.

**Forgot password**: `POST /auth/forgot-password` (always 202, never reveals whether the e-mail exists) then `POST /auth/reset-password` with the e-mail, code and new password. Check `app/schemas/auth.py` for exact field names. After a reset every old token stops working.

**Google sign-in**
1. `POST /auth/google/nonce` returns `{nonce}` (stored server-side, one-time, short-lived).
2. Load Google Identity Services (`https://accounts.google.com/gsi/client`) lazily, `google.accounts.id.initialize({client_id: VITE_GOOGLE_CLIENT_ID, nonce, callback})`, render the button.
3. Send the returned ID token and the nonce to `POST /auth/google`; it returns the token. A working reference implementation is the dev page in `../backend/app/api/dev_pages.py` (open `http://localhost:8000/dev/google`).
4. If `VITE_GOOGLE_CLIENT_ID` is empty, do not render the button at all.

**Session**
- Store the token in `localStorage` under one key, behind an `auth-storage` module (try/catch around every access). Keep the current user from `GET /users/me` in the Query cache.
- On app start: if a token exists, fetch `/users/me`; on 401 clear the token. Show a full-page skeleton until resolved.
- Tokens carry `iat`; the backend invalidates tokens issued before the last password change ("sign out everywhere"). A 401 after a password reset is expected.
- Redirect rules: unauthenticated user on a protected route goes to `/sign-in?next=<path>`; after sign in go to `next` or the role home (student: `/learning`, teacher: `/studio`, admin: `/admin`).

## Roles and guards

`GET /users/me` returns `role`. Build a `RequireRole` route guard and a `useCan()` hook. Hide actions the role cannot perform, and still handle 403 from the API. Teachers can see only their own courses in studio; the API enforces ownership.

## Courses, curriculum and learning flow

- Catalog: `GET /courses` with `search`, `category_id`, `price` filters, `sort`, `page`, `size` (read the exact params in `app/api/v1/courses.py`). Course detail `GET /courses/{id}`; program `GET /courses/{id}/program` (modules, lessons, quizzes; preview flags; no video URLs).
- Enrollment lifecycle (State pattern in the backend): enroll creates an enrollment; paid courses need `POST /enrollments/{id}/pay`; cancel with `POST /enrollments/{id}/cancel`. Read the allowed statuses and transitions from `app/patterns/states/` and render buttons only for legal transitions; always trust the status returned by the server.
- Learning: `GET /enrollments/{id}/progress` returns summary, per-module progress and `next_lesson_id`. Complete and undo with `POST` and `DELETE /enrollments/{id}/lessons/{lesson_id}/complete`, both return the fresh progress object (use it to update the cache directly). `GET /learning/history` feeds the dashboard.
- A lesson is readable by: its teacher, admins, enrolled students with an active enrollment, and anybody for preview lessons. Otherwise the API answers 403.

## Video and files (S3-compatible storage)

Storage is private. The browser never talks to the API for bytes; it uploads to and downloads from the storage with **presigned URLs**.

**Upload (teacher), three steps**
1. `POST /lessons/{id}/video/upload-url` with filename, content type and size returns `{upload_url, method: "PUT", headers, upload_ticket, expires_in}`.
2. `PUT` the file to `upload_url` with **exactly** the returned `headers` and the raw file as body. Use `XMLHttpRequest` to get upload progress events (fetch has none). Do not add an `Authorization` header (it would break the signature). Support cancel via `abort()`.
3. `POST /lessons/{id}/video/confirm` with the `upload_ticket`; the backend verifies the object exists and attaches it. The response is the updated lesson.
Materials work the same way through `/lessons/{id}/materials/upload-url` and `/materials/confirm`. Validate file type and size on the client first (the API returns the limits in its error messages; read `app/services` for the allowed types).

**Playback and download**: `GET /lessons/{id}/video-url` and `GET /materials/{id}/download-url` return `{url, expires_in}`. Put `url` into `<video src>` or open it for download. URLs expire; request a new one on the `error` event or shortly before `expires_in`. Never cache these URLs in the Query cache longer than `expires_in`.

**Local gotcha**: in development the storage is RustFS at `http://localhost:9000`; its bucket needs a CORS rule for `http://localhost:5173` (see `docs/08-local-environment.md`). If the PUT fails with a CORS error, that is the cause, not your code.

## Quizzes

Teacher side: `POST /modules/{id}/quiz`, `GET /quizzes/{id}/manage` (includes correct answers), questions CRUD and ordering. Student side: `POST /quizzes/{id}/attempts` starts an attempt and returns the questions **without** correct answers; `POST /attempts/{id}/submit` with answers returns score, `passed`, and a per-question `review` (visible only after submit). `GET /quizzes/{id}/my-attempts` lists history. Attempt status machine: `in_progress` then submitted/graded; free-text answers wait for teacher review (`GET /reviews/pending`, `POST /attempts/{id}/review`). Read `app/schemas/quiz.py` for question types and answer shapes and build one component per type from a discriminated union.

## Notifications and WebSocket

REST is the source of truth: `GET /notifications` (paged), `GET /notifications/unread-count`, `POST /notifications/{id}/read`, `POST /notifications/read-all`.

Live updates:
1. `POST /ws/ticket` (authenticated) returns `{ticket, expires_in}`. The ticket is single use and short-lived.
2. Open `ws://localhost:8000/api/v1/ws?ticket=<ticket>` (use `wss` behind HTTPS, derive from `VITE_API_URL`).
3. Messages have the same JSON shape as `NotificationOut`. On message: prepend to the notifications cache, increment the unread counter, show a toast.
4. On close: reconnect with exponential backoff and jitter (1 s up to 30 s), always with a **fresh ticket**. While disconnected, poll `unread-count` every 60 s. Close the socket on sign out. Implement as one `NotificationsProvider` with a small, tested reconnecting-socket class.

## Certificates

`GET /certificates/mine`, public `GET /certificates/verify/{number}` (no auth), `GET /certificates/{id}/pdf` (bearer, blob). The verification page is public and shareable: `/certificates/verify/:number`.

## Reports and analytics

Admin: `/reports/admin/overview`, `/courses`, `/teachers`, `/revenue`, `/revenue/breakdown`, `/users/growth`. Teacher: `/reports/teacher/dashboard` and per-course `funnel`, `quizzes`, `questions`, `students`. All accept `?format=csv` to download instead of JSON, and date-range parameters (check `app/api/v1/reports.py`). The report endpoints are rate limited; debounce range changes.

## Recommendations

`GET /recommendations` returns a list ranked by the strategy chain collaborative then category then popular; it works for signed-in users and falls back for visitors if the API allows. Show the reason text if the schema provides one.

## Health

`/health` and `/health/ready` are for infrastructure. The frontend may call `/health/ready` once on start in development to show a "backend unavailable" banner when it fails; never in production builds.

## Environment variables (frontend)

| Variable | Purpose | Dev value |
|---|---|---|
| `VITE_API_URL` | Backend origin, no trailing slash, no `/api/v1` | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id (optional) | empty |

Read them through one typed `src/config/env.ts` that validates with zod and fails fast with a readable error.
