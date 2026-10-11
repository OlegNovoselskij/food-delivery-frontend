# Backend changes

Changes made to the backend while building the frontend.

## 2026-10-11 Module count on course cards

- Commit: fff0403 in backend
- Change: `CourseListItem` (and so `CourseOut`) gets an integer `modules_count`, computed from the `modules` relationship that the course queries now load with `selectinload`.
- Reason: the catalog cards and dashboard show one progress segment per module, which needs the module count without fetching every program.
- Contract impact: `GET /courses`, `GET /courses/{id}`, `GET /courses/mine`, enrollment and history payloads that embed a course; additive yes.
