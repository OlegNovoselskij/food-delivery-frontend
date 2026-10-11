# 09. Rules for changing the backend

The backend is finished, tested and documented as part of the same course project. You may adjust it when it makes the frontend simpler or fixes a real problem, but you do not redesign it.

## Allowed (small, additive, safe)

- Fix a bug you can reproduce, with a regression test.
- Add an optional query parameter, an extra field in a response, or a convenience endpoint that wraps existing service logic (for example a missing filter, a count, a `include` flag).
- Loosen or correct CORS, rate-limit numbers for development, or default config values in `.env.example`.
- Improve an error message or add a missing `detail` field so the UI can act on it.
- Add or fix seed data in `app/scripts/seed_demo.py` so screens have realistic content.
- Add an Alembic migration for a **purely additive** change (new nullable column, new index) that one of the above needs.

## Not allowed without being told to (global decisions)

- Renaming, removing or changing the meaning of existing endpoints, fields, enum values or status codes.
- Changing the auth model (JWT, OTP, Google flow, roles), token format or lifetime.
- Changing the database schema destructively, rewriting migrations that exist, switching databases, caches or storage providers.
- Refactoring or removing design patterns (Factory Method, State, Strategy, Composite, Observer, Proxy, Adapter, Template Method) or moving modules around.
- Adding heavy dependencies, changing Python or base image versions.
- Anything in deployment or infrastructure (those live in another repository).

If you need something in the second list, do not do it. Work around it on the frontend, note the limitation in `docs/DECISIONS.md` and in the final report.

## Procedure for every backend change

1. Reproduce or define the need; check `git -C ../backend status` is clean before you start.
2. Make the smallest change. Match the existing style (English comments are allowed in the backend where the existing code has them; do not mass-edit).
3. Add or update a test in `../backend/tests`.
4. Run, inside the backend container: `docker compose exec backend ruff check . && docker compose exec backend ruff format --check . && docker compose exec backend pytest -q`. All must pass.
5. For a model change: `docker compose exec backend alembic revision --autogenerate -m "<message>"`, read the generated file, make sure it only does the additive change, then `docker compose exec backend alembic upgrade head`.
6. Commit **inside the backend repository** (`git -C ../backend add ... && git -C ../backend commit -m "fix(courses): ..."`), Conventional Commits, one change per commit. Never push.
7. Append an entry to `BACKEND_CHANGES.md` in the frontend folder: date, commit hash, what and why, which endpoints or schemas are affected.
8. Regenerate frontend types with `npm run api:types` and commit that in the frontend repository.

## `BACKEND_CHANGES.md` format

```
## <date> <short title>
- Commit: <hash> in backend
- Change: <what changed>
- Reason: <what frontend need it serves>
- Contract impact: <endpoints or schemas>, additive yes/no
```

The file starts with the header `# Backend changes` and the sentence "Changes made to the backend while building the frontend." and is created with those lines if it does not exist.
