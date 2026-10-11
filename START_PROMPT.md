You are the sole engineer of the Atrium frontend. Build the entire frontend from an empty project to a finished, tested, deployable application, working autonomously until it is done.

Your working directory is `frontend/`. The finished backend is in `../backend`. Everything you need is in this folder:

- `CLAUDE.md` holds the rules; they are loaded automatically. Obey them literally, especially: no comments in code, no crutches, English UI, typed API from the OpenAPI schema.
- `docs/` is the specification. Start with `docs/00-overview.md` and `docs/01-scope.md`, then read the others when their topic comes up (the table in `CLAUDE.md` says when).
- `design/screenshots/*.png` show the target look; `design/mockups/*.html` are their source; `design/tokens.css` holds the design tokens. Look at every screenshot before writing UI code.

Do this:

1. Read `CLAUDE.md`, `docs/00-overview.md`, `docs/01-scope.md`, `docs/06-architecture.md`, `docs/07-quality.md`, `docs/08-local-environment.md`, and view all screenshots.
2. Start the backend as described in `docs/08-local-environment.md`, apply migrations, load the demo data, and confirm `http://localhost:8000/health/ready` is healthy. Read the backend routers and schemas as you need them.
3. Create the task list from the milestones M0 to M10 in `docs/01-scope.md` and execute them strictly in order. For each milestone: implement, write tests, run `npm run check`, run the app and verify it in a real browser with Playwright against the real backend (screenshots at desktop and mobile widths, light and dark), compare with the design, fix what you see, then commit with Conventional Commits.
4. If the backend blocks you, follow `docs/09-backend-change-rules.md`: only small, additive, tested fixes, committed in the backend repository and logged in `BACKEND_CHANGES.md`. Never make global decisions there.
5. Do not ask me questions. Where the docs are silent, choose the most conventional option and record it in one line in `docs/DECISIONS.md`. Stop only for something irreversible or something that needs credentials you do not have.
6. Finish with `README.md`, final screenshots in `docs/screenshots/`, and a short report: what was built, what was verified and how, known gaps, and every backend change.

Begin now with a one-sentence statement of what you are about to do, then start working.
