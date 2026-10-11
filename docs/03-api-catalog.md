# 03. API catalog

All paths are relative to `/api/v1` unless they start with `/health`, `/admin` or `/dev`. This is an index to help you plan; request and response shapes are in `src/api/schema.d.ts` (generated) and `../backend/app/schemas/`. Access column: **public** needs no token, **user** any signed-in user, **teacher** teacher who owns the resource (admin also passes), **admin** admin only, **owner** the user who owns the object. Verify the exact rule in the router source before relying on it.

## Auth `/auth`

| Method and path | Access | Purpose |
|---|---|---|
| POST `/auth/register` | public | Start sign up, sends code (202) |
| POST `/auth/resend-code` | public | Resend sign-up code (202) |
| POST `/auth/verify-email` | public | Confirm code, set password, returns token |
| POST `/auth/login` | public | E-mail and password, returns token |
| POST `/auth/forgot-password` | public | Send reset code (202) |
| POST `/auth/reset-password` | public | Code and new password |
| POST `/auth/google/nonce` | public | One-time nonce for Google sign-in |
| POST `/auth/google` | public | Exchange Google ID token for app token |

## Users and categories

| Method and path | Access | Purpose |
|---|---|---|
| GET `/users/me` | user | Current user |
| PATCH `/users/me` | user | Update name, bio |
| GET `/categories` | public | List categories |
| POST `/categories` | admin | Create |
| PATCH `/categories/{id}` | admin | Update |
| DELETE `/categories/{id}` | admin | Delete (204) |

## Courses

| Method and path | Access | Purpose |
|---|---|---|
| GET `/courses` | public | Paged catalog with search, filters, sort (cached, rate limited) |
| GET `/courses/mine` | teacher | Own courses of every status |
| GET `/courses/{id}` | public for published, owner otherwise | Course detail |
| POST `/courses` | teacher | Create draft |
| PATCH `/courses/{id}` | teacher | Update |
| POST `/courses/{id}/publish` | teacher | Draft to published |
| POST `/courses/{id}/archive` | teacher | Published to archived |
| DELETE `/courses/{id}` | teacher | Delete (204) |

## Curriculum

| Method and path | Access | Purpose |
|---|---|---|
| GET `/courses/{id}/program` | public for published | Modules, lessons, quizzes |
| POST `/courses/{id}/modules` | teacher | Add module |
| PUT `/courses/{id}/modules/order` | teacher | Reorder modules, returns program |
| PATCH `/modules/{id}` | teacher | Rename |
| DELETE `/modules/{id}` | teacher | Delete |
| POST `/modules/{id}/lessons` | teacher | Add lesson |
| PUT `/modules/{id}/lessons/order` | teacher | Reorder lessons, returns module |
| GET `/lessons/{id}` | enrolled, owner, preview | Lesson with materials |
| PATCH `/lessons/{id}` | teacher | Update |
| DELETE `/lessons/{id}` | teacher | Delete |

## Media

| Method and path | Access | Purpose |
|---|---|---|
| POST `/lessons/{id}/video/upload-url` | teacher | Presigned PUT instructions |
| POST `/lessons/{id}/video/confirm` | teacher | Attach uploaded video |
| DELETE `/lessons/{id}/video` | teacher | Remove video |
| GET `/lessons/{id}/video-url` | enrolled, owner, preview | Presigned playback URL |
| POST `/lessons/{id}/materials/upload-url` | teacher | Presigned PUT for a file |
| POST `/lessons/{id}/materials/confirm` | teacher | Attach file |
| DELETE `/materials/{id}` | teacher | Remove file |
| GET `/materials/{id}/download-url` | enrolled, owner | Presigned download URL |

## Enrollment and learning

| Method and path | Access | Purpose |
|---|---|---|
| POST `/courses/{id}/enroll` | user | Enroll (free: active, paid: awaiting payment) |
| GET `/enrollments/mine` | user | My enrollments |
| GET `/enrollments/{id}` | owner | One enrollment |
| POST `/enrollments/{id}/pay` | owner | Simulated payment (rate limited) |
| POST `/enrollments/{id}/cancel` | owner | Cancel |
| GET `/enrollments/{id}/progress` | owner | Progress object |
| POST `/enrollments/{id}/lessons/{lesson_id}/complete` | owner | Mark done, returns progress |
| DELETE `/enrollments/{id}/lessons/{lesson_id}/complete` | owner | Undo, returns progress |
| GET `/learning/history` | user | Learning history |

## Quizzes

| Method and path | Access | Purpose |
|---|---|---|
| POST `/modules/{id}/quiz` | teacher | Create quiz for a module |
| GET `/quizzes/{id}/manage` | teacher | Full quiz with answers |
| PATCH `/quizzes/{id}` | teacher | Update settings |
| DELETE `/quizzes/{id}` | teacher | Delete |
| POST `/quizzes/{id}/questions` | teacher | Add question |
| PUT `/quizzes/{id}/questions/order` | teacher | Reorder |
| PUT `/questions/{id}` | teacher | Replace question |
| DELETE `/questions/{id}` | teacher | Delete |
| POST `/quizzes/{id}/attempts` | enrolled | Start attempt |
| GET `/quizzes/{id}/my-attempts` | enrolled | Attempt history |
| GET `/attempts/{id}` | owner | Attempt (questions while in progress, review after submit) |
| POST `/attempts/{id}/submit` | owner | Submit answers |
| GET `/reviews/pending` | teacher | Attempts waiting for manual grading |
| POST `/attempts/{id}/review` | teacher | Grade free-text answers |

## Reviews

| Method and path | Access | Purpose |
|---|---|---|
| GET `/courses/{id}/reviews` | public | Paged reviews with summary |
| GET `/courses/{id}/reviews/mine` | user | Own review or `null` |
| POST `/courses/{id}/reviews` | enrolled | Create |
| PUT `/reviews/{id}` | owner | Update |
| DELETE `/reviews/{id}` | owner or admin | Delete |

## Certificates and notifications

| Method and path | Access | Purpose |
|---|---|---|
| GET `/certificates/mine` | user | My certificates |
| GET `/certificates/verify/{number}` | public | Verify a certificate |
| GET `/certificates/{id}/pdf` | owner | PDF file |
| GET `/notifications` | user | Paged list |
| GET `/notifications/unread-count` | user | Unread count |
| POST `/notifications/read-all` | user | Mark all read |
| POST `/notifications/{id}/read` | user | Mark one read |
| POST `/ws/ticket` | user | One-time WebSocket ticket |
| WS `/ws?ticket=...` | ticket | Live notifications |

## Reports (`/reports`, rate limited, `?format=csv` supported)

| Method and path | Access | Purpose |
|---|---|---|
| GET `/reports/admin/overview` | admin | KPIs |
| GET `/reports/admin/courses` | admin | Course statistics |
| GET `/reports/admin/teachers` | admin | Teacher ranking |
| GET `/reports/admin/revenue` | admin | Revenue time series |
| GET `/reports/admin/revenue/breakdown` | admin | Revenue split |
| GET `/reports/admin/users/growth` | admin | User growth |
| GET `/reports/teacher/dashboard` | teacher | Own courses stats |
| GET `/reports/teacher/courses/{id}/funnel` | teacher | Enrolled, started, completed funnel |
| GET `/reports/teacher/courses/{id}/quizzes` | teacher | Quiz statistics |
| GET `/reports/teacher/courses/{id}/questions` | teacher | Per-question difficulty |
| GET `/reports/teacher/courses/{id}/students` | teacher | Student list and progress |

## Other

| Method and path | Access | Purpose |
|---|---|---|
| GET `/recommendations` | user (visitor fallback) | Recommended courses |
| GET `/health`, `/health/ready` | public | Liveness, readiness |
| `/admin` | admin session | SQLAdmin panel (link only) |
| GET `/dev/google` | dev only | Reference Google sign-in page |

## Demo accounts (after `seed_demo`)

Password for everyone: `Demo12345!`. Admin `admin@demo.test`. Teachers `olena@demo.test`, `taras@demo.test`, `iryna@demo.test`. Students `andrii@demo.test`, `maria@demo.test` and more (see the seed script output). The seed includes draft and archived courses, quizzes, enrollments in different states, progress, reviews and certificates.
