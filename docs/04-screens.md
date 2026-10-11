# 04. Screens, routes and states

Mockups exist for the screens marked with a file name in `design/screenshots/` (HTML source in `design/mockups/`). For every other screen, compose it from the same components, spacing and patterns. Every page sets `document.title` as `<Page> · Atrium`.

## Route map

| Route | Screen | Access | Layout | Mockup |
|---|---|---|---|---|
| `/` | Redirect to `/courses` | public | none | |
| `/courses` | Catalog | public | public | 01, 08 |
| `/courses/:courseId` | Course detail | public | public | 02 |
| `/certificates/verify/:number` | Certificate verification | public | public | |
| `/sign-in` | Sign in | guest only | auth | 07 (style) |
| `/sign-up` | Sign up, then code step | guest only | auth | 07 |
| `/forgot-password` | Request reset code | guest only | auth | |
| `/reset-password` | Code and new password | guest only | auth | |
| `/learning` | My learning dashboard | user | learner | 04 |
| `/learning/courses/:courseId` | Lesson player (redirects to `next_lesson_id`) | enrolled | player | 03 |
| `/learning/courses/:courseId/lessons/:lessonId` | Lesson player | enrolled or preview | player | 03 |
| `/learning/quizzes/:quizId` | Quiz attempt | enrolled | player | |
| `/learning/attempts/:attemptId` | Attempt result | owner | learner | |
| `/certificates` | My certificates | user | learner | |
| `/notifications` | All notifications | user | learner | |
| `/profile` | Profile settings | user | learner | |
| `/studio` | Teacher dashboard | teacher, admin | studio | |
| `/studio/courses/new` | Create course | teacher | studio | |
| `/studio/courses/:courseId` | Course builder (details, curriculum) | owner | studio | 05 |
| `/studio/courses/:courseId/lessons/:lessonId` | Builder with lesson panel selected | owner | studio | 05 |
| `/studio/quizzes/:quizId` | Quiz builder | owner | studio | |
| `/studio/courses/:courseId/analytics` | Course analytics | owner | studio | |
| `/studio/grading` | Pending free-text reviews | teacher | studio | |
| `/admin` | Platform overview | admin | admin | 06 |
| `/admin/courses`, `/admin/teachers` | Detailed tables | admin | admin | 06 (style) |
| `/admin/categories` | Categories CRUD | admin | admin | |
| `*` | Not found | any | public | |
| `/403`, `/error` | Forbidden, crash page | any | public | |

Layouts: **public** (topbar with logo, nav, search, bell if signed in, avatar menu or "Sign in"/"Get started"), **learner** (same topbar plus My learning, Certificates), **studio** and **admin** (same topbar, role-specific nav), **player** (slim top bar with back link, course title, progress; no footer), **auth** (split screen like mockup 07). A small footer on public pages.

## Per-screen requirements

**Catalog**: hero with search, category chips from `/categories`, filters (free and paid, sort), grid of cards (cover, category badge, rating, title, teacher, segmented module track, price, button), numbered pagination, "Recommended for you" row for signed-in users above the grid when the API returns items. Cards without a cover URL show the generated cover (deterministic from course id, same palette as the mockups). All filters live in the URL.

**Course detail**: header (breadcrumb, title, summary, teacher, rating, category), tabs Program, Reviews, Teacher. Program is an accordion with module numbers, lesson rows (type icon, title, duration, "Preview" badge, lock for the rest), quiz rows. Sticky enroll card: price, primary action depending on state (Enroll, Pay now, Continue learning, Edit in studio for owner), what is included. Reviews tab: rating summary, list, write or edit own review form for enrolled students.

**Auth**: forms use react-hook-form + zod; field-level server errors; password rules shown before submit; code input is six boxes with paste support, auto-advance and backspace handling, announces errors to screen readers; resend button with a live cooldown; "Continue with Google" below a divider.

**My learning**: greeting, resume card (the enrollment with latest activity, link to `next_lesson_id`), "In progress" list with module-segmented tracks, "Completed", certificates panel, stats, recent activity from history. Empty state links to the catalog.

**Lesson player**: described in the mockup; video area with native controls (do not build a custom player), title, tabs Overview, Materials, optional Discussion omitted unless the API supports it (omit it, mockup tab is illustrative), actions Mark as complete / Mark as incomplete and Next lesson. The Path sidebar shows modules with node states: done (filled), current (ring), upcoming (empty), quiz (diamond), locked (muted). It collapses into a drawer below 1024 px. If a lesson has no video yet, show an explanatory placeholder.

**Quiz**: one page, questions stacked or paged (your call, keep keyboard friendly), progress indicator, confirm before submit, result screen with score ring, passed/failed message, per-question review (your answer, correct answer, explanation if provided), retry and back to course.

**Certificates**: cards with number, course, date, download PDF, copy verification link; public verify page shows a valid or invalid state clearly without requiring sign in.

**Notifications**: bell with unread dot and count, dropdown of the latest ten, "View all" page with mark-all-read, items link to the related course or certificate.

**Studio dashboard**: KPI strip (courses, students, revenue if provided, rating), table or cards of own courses with status badge (draft, published, archived), quick actions. **Builder**: as mockup 05; module and lesson drag and drop with dnd-kit (keyboard sensors too), inline rename, add lesson and module, selected lesson edited in the right panel (title, description, video, materials, free-preview toggle, duration if applicable), course settings in a separate tab. **Quiz builder**: question list with drag handles, question editor per type, correct answer selection, points, validation before save. **Analytics**: funnel, quiz table, hardest questions, students table with progress, CSV export button.

**Admin overview**: as mockup 06 with a range switch that drives the queries, an accessible chart with a "View as table" toggle, ranking tables, export. **Categories**: table with inline edit and delete with confirmation.

**Profile**: name and bio form, e-mail shown read-only, role badge, theme toggle, sign out.

## Global UI behaviour

- Toasts via sonner: bottom right, 4 s, an action where undo is possible. Same verb in button and toast.
- Confirmation dialog for every destructive action; the confirm button names the action ("Delete module").
- Forms: submit disabled while pending, dirty-state warning when leaving the builder with unsaved edits, Enter submits.
- Skeletons mirror the final layout. Empty states have one sentence and one action. Error states show the API message and a "Try again" button; 500s show the request id.
- Offline or backend down: a slim banner with retry.
- Focus management: move focus to the page heading on route change, restore focus after dialogs.
