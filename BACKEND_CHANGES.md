# Backend changes

Changes made to the backend while building the frontend.

## 2026-10-11 Module count on course cards

- Commit: fff0403 in backend
- Change: `CourseListItem` (and so `CourseOut`) gets an integer `modules_count`, computed from the `modules` relationship that the course queries now load with `selectinload`.
- Reason: the catalog cards and dashboard show one progress segment per module, which needs the module count without fetching every program.
- Contract impact: `GET /courses`, `GET /courses/{id}`, `GET /courses/mine`, enrollment and history payloads that embed a course; additive yes.

## 2026-10-12 Quiz id and question count in the program

- Commit: f4b0af8 in backend
- Change: `ModuleOut` gets `quiz_id` (nullable integer) and `quiz_questions_count`; the program query loads quizzes with their questions.
- Reason: a teacher cannot find the quiz of a module from the program, so the quiz builder had no way to open it; the public program can also show "N questions" per module quiz.
- Contract impact: `GET /courses/{id}/program` and every response that embeds a module (`PUT /modules/{id}/lessons/order`, `PATCH /modules/{id}`, `POST /courses/{id}/modules`); additive yes.
