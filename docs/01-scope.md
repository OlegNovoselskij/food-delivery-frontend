# 01. Scope of work and milestones

Work in this order. Each milestone ends with: acceptance list passes, `npm run check` green, browser verification against the real backend with seed data, a commit (or several). Do not start a milestone before the previous one is closed.

## M0. Foundation

- Vite + React + TypeScript strict project in this folder (not a subfolder). Tailwind v4 with `design/tokens.css` merged into `src/styles/index.css`. shadcn/ui initialised (components copied into `src/components/ui`, restyled to the tokens). Inter via `@fontsource-variable/inter`.
- ESLint flat config (typescript-eslint strict, react-hooks, jsx-a11y, import ordering, `no-console`, `no-explicit-any`, ban `eslint-disable`), Prettier, Vitest, Playwright, path alias `@/`.
- `scripts/check-no-comments.mjs` wired as `check:comments`.
- `api:types` script generating `src/api/schema.d.ts`; typed API client with auth header, error normalisation, 401 handling.
- App shell: providers (Query, Router, Auth, Toaster), layouts (public, learner, studio, admin), route tree with lazy-loaded pages, error boundary, 404 page, skeleton and empty-state primitives.
- `Dockerfile` (multi-stage, nginx serving SPA with history fallback and long cache for hashed assets) and `.dockerignore`, `nginx.conf`, `.env.example`.
- Acceptance: `npm run check` green on an app that renders the shell, a styled placeholder home and the 404; the Docker image builds and serves.

## M1. Authentication

Screens: sign in, sign up, verify email (6-digit code), forgot password, reset password, Google button. Details in `02-backend-integration.md` section "Authentication".
- Acceptance: register a new student end to end using the code from Mailpit; sign in; wrong password and wrong code show the right messages; rate-limit (429) shows a countdown; Google sign-in works when `VITE_GOOGLE_CLIENT_ID` is set and the button is hidden when it is not; signed-in state survives reload; sign out clears everything; protected routes redirect to sign in and back; role guards hide and block pages the role cannot use.

## M2. Public catalog and course page

Catalog (search, category chips, price filter, sort, pagination synced to the URL), course detail (program with preview markers, reviews list, teacher block, enroll card), certificate verification page `/certificates/verify/:number`.
- Acceptance: filters survive reload and back button; empty results state; course page for visitor, for enrolled student and for the owning teacher renders the right call-to-action; matches `design/screenshots/01`, `02`, `08`.

## M3. Enrollment and payment

Enroll, pay (simulated), cancel; my enrollments; handling of every enrollment status; rate limit on pay.
- Acceptance: free course enrolls instantly; paid course goes pay then active; cancel works only where the API allows; UI reflects server state after each action (invalidate queries, no stale buttons).

## M4. Learning

Learner dashboard "My learning" (resume card, enrollments with module-segmented progress, certificates, history, stats), lesson player (presigned video, materials download, mark complete or undo, next lesson, the Path sidebar with module progress, locked states, 403 handling for not-enrolled), learning history.
- Acceptance: matches `design/screenshots/03`, `04`; progress updates optimistically and reconciles with the server; video URL refreshes when it expires; resume goes to `next_lesson_id`; keyboard shortcuts for the player (space, arrows, `m` for mute) documented in the UI.

## M5. Quizzes and reviews

Take a quiz (start attempt, answer all question types the API supports, submit, result with per-question review, retry rules, history of attempts), course reviews (read, create, edit, delete own, rating summary).
- Acceptance: timer or progress shown if the API provides it; no way to submit twice; result page explains passed/failed with score and passing score; reviews only for enrolled students as the API enforces.

## M6. Certificates and notifications

Certificates list, public verification, PDF download (authenticated download as blob). Notifications: bell with unread count, dropdown, full page, mark read, mark all read, WebSocket live updates with reconnect (ticket flow), toast on new notification.
- Acceptance: completing a course creates a certificate and a notification that appears live without reload; WebSocket survives backend restart (reconnect with backoff and a fresh ticket); falls back to polling `unread-count` every 60 s when the socket is down.

## M7. Studio (teacher)

Teacher dashboard (my courses with status, per-course KPIs), course create and edit (details, category, price, cover URL, publish, archive, delete with confirmation), curriculum builder (modules and lessons, drag and drop ordering with optimistic updates, rename, delete), lesson editor with 3-step video upload with real progress, replace and remove video, materials upload, quiz builder (create quiz, questions of every supported type, ordering, edit, delete), pending reviews queue (free-text grading), course analytics (funnel, quiz stats, hard questions, students) with CSV export.
- Acceptance: matches `design/screenshots/05`; upload of a real video file to the local storage works and the lesson becomes playable; publish is blocked with a clear message when the API rejects it; every destructive action asks for confirmation.

## M8. Admin

Overview analytics (KPIs, revenue chart with range switch, breakdown, user growth, teachers ranking, course stats), categories management, CSV exports, link to the backend admin panel.
- Acceptance: matches `design/screenshots/06`; charts are accessible (title, summary text, table fallback); CSV download works with auth.

## M9. Recommendations, profile, polish

"Recommended for you" on the catalog and dashboard (from `/recommendations`), profile page (edit name and bio via `PATCH /users/me`, change password if the API offers it, sign out everywhere explanation), dark theme (tokens already defined, toggle in the user menu, persisted, respects system default), keyboard command palette is optional, 404/403/500 pages, favicon, page titles, meta tags.

## M10. Hardening and delivery

- Unit tests for utilities, hooks and forms; component tests for key components; MSW-backed tests for data screens; Playwright e2e for the critical journeys (see `07-quality.md`).
- Accessibility pass (axe in Playwright on every main page, zero serious violations), Lighthouse pass (performance, accessibility, best practices at least 90 on catalog and course pages), bundle check (route-level code splitting; no chunk over 250 kB gzip except charts and player).
- Final screenshots of every screen at 1440 and 390 widths saved to `docs/screenshots/` and referenced in `README.md`.
- `README.md`, `docs/DECISIONS.md`, `BACKEND_CHANGES.md` complete. Clean `git log`.
