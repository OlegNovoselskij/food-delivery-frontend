# 07. Quality, testing and verification

## Gates

`npm run check` must pass before every commit and at the end of every milestone: `tsc --noEmit`, ESLint with zero warnings, Prettier check, `check:comments`, unit and component tests, production build. Fix causes, never silence rules. `eslint-disable`, `@ts-ignore` and `@ts-expect-error` are forbidden and listed as banned in the ESLint config.

## ESLint essentials

typescript-eslint strict and stylistic type-checked, `react-hooks`, `jsx-a11y` recommended, `import/order` (builtin, external, internal alias, relative; alphabetised), `no-console`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/consistent-type-imports`, `no-restricted-syntax` for default exports in non-route files, `eslint-comments/no-use` equivalent via `linterOptions.noInlineConfig: true` (inline config comments are ignored and reported). Prettier: single quotes off (double quotes), semicolons on, trailing commas all, print width 100.

## Tests

- **Unit (Vitest)**: money and date formatting, filename and size validation, the reconnecting socket (fake timers: backoff, fresh ticket each attempt, close on sign out), query-param parsing, quiz answer builders, progress reducers.
- **Component (Testing Library + MSW)**: sign-in and sign-up forms (validation, server errors, 429 countdown), `CodeInput` (paste, backspace), `CourseCard` states, catalog filters bound to the URL, enroll card per role and status, `PathRail` states, upload dropzone with mocked XHR, quiz question components per type.
- **E2E (Playwright, real backend with seed data, Chromium)**: specs in `e2e/`, global setup checks `/health/ready` and fails with a helpful message otherwise. Journeys:
  1. Visitor browses, filters and opens a course; enroll redirects to sign in and back.
  2. Student signs up with the code read from Mailpit (`http://localhost:8025/api/v1/messages`), enrolls in a free course and completes a lesson.
  3. Student buys a paid course, plays a video lesson, passes a quiz, receives a certificate and a live notification, downloads the PDF.
  4. Teacher creates a course, adds module and lessons, reorders by keyboard, uploads a small test video, builds a quiz, publishes; course appears in the catalog.
  5. Admin opens overview, switches range, exports CSV.
  6. Forgot password flow; sign out everywhere effect.
- Test data: seed accounts only; tests that mutate create their own course or user with unique names.
- Coverage target 80 percent lines on `src/lib`, `src/hooks` and `features/*/` logic files; do not chase coverage on pure markup.

## Visual verification (mandatory)

For every page you build: run it, open it with Playwright at 1440x900 and 390x844 in light and dark, save a screenshot to `docs/screenshots/<name>-<theme>-<width>.png`, view it, and compare with the mockup or with the design language. Fix visible issues (misalignment, wrong spacing, overflow, contrast, missing states) before closing the milestone. Include loading, empty and error states in screenshots by using route interception.

## Accessibility and performance checks

- `@axe-core/playwright` on every main page in both themes: zero serious or critical violations.
- Keyboard-only pass for auth, catalog, player, quiz, builder (drag and drop with keyboard).
- Lighthouse (run with `npx lighthouse` against `npm run preview`) on catalog and course pages: Performance, Accessibility, Best Practices all at least 90.
- Responsive: no horizontal scroll at 360 px; tables become cards or scroll inside their container.

## Review checklist before closing a milestone

- No comment, `any`, console call, TODO, dead export, unused dependency (`npx knip` or `depcheck` once at the end).
- Every API call typed from the schema; every query has loading, empty and error handling.
- Texts reviewed for voice; no placeholder copy.
- Git history readable: Conventional Commits, one concern per commit.
- `BACKEND_CHANGES.md` updated if `../backend` was touched.
