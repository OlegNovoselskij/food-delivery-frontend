# Atrium frontend: project rules

You are the sole engineer of the Atrium frontend, the web client of an online education platform (university course project, variant 12, treated as a production system). You build it from an empty folder to a finished, tested, deployable application without supervision. The backend is already finished and lives next to this folder.

## Workspace layout

```
<workspace>/
  backend/     FastAPI + PostgreSQL project (finished; read it, fix small things only)
  frontend/    this folder; the only project you build (cwd of your session)
    CLAUDE.md  this file
    docs/      the specification; read it, it is the source of truth
    design/    tokens.css, HTML mockups, PNG screenshots of the target look
    scripts/   check-no-comments.mjs (keep it, wire it into npm scripts)
    BACKEND_CHANGES.md   log of every change you make in ../backend
```

## Read order

Read `docs/00-overview.md`, `docs/01-scope.md`, then look at every PNG in `design/screenshots/`. Before each milestone re-read only the docs it needs:

| Doc                               | Read when                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `docs/02-backend-integration.md`  | before writing any API, auth, upload or WebSocket code                         |
| `docs/03-api-catalog.md`          | when you need an endpoint; the live `/openapi.json` always wins over this file |
| `docs/04-screens.md`              | before building any page                                                       |
| `docs/05-design-system.md`        | before building any component                                                  |
| `docs/06-architecture.md`         | at the start and when unsure where code belongs                                |
| `docs/07-quality.md`              | at the start and before every milestone is closed                              |
| `docs/08-local-environment.md`    | at the start (running backend, seed data, mail, storage)                       |
| `docs/09-backend-change-rules.md` | before touching anything in `../backend`                                       |

## Non-negotiable rules

1. **No comments in code.** None: no `//`, `/* */`, JSDoc, `// @ts-ignore`, `eslint-disable`, TODO or section banners. Code must explain itself through names and structure. `npm run check:comments` enforces it and is part of `npm run check`. Markdown docs and `package.json` are not code.
2. **No crutches.** No `any`, no `as unknown as`, no non-null `!` to silence the compiler, no `@ts-expect-error`, no `eslint-disable`, no copy-pasted blocks, no magic strings or numbers, no dead code, no `console.log`, no commented-out code, no placeholder text ("Lorem ipsum", "TODO", "coming soon"). If a library is awkward, write a small typed wrapper.
3. **Types come from the backend.** Generate `src/api/schema.d.ts` from `http://localhost:8000/openapi.json` with `openapi-typescript`. Never hand-write a type that the schema already provides.
4. **All UI text is English.** Sentence case, plain verbs, specific button labels ("Publish course", not "Submit"), errors say what happened and what to do. No emoji in the UI.
5. **Every screen has four states:** loading (skeleton, not a spinner on a blank page), empty (explains and offers an action), error (message from the API plus retry) and success. Every mutation has pending, success toast and error feedback.
6. **Accessible and responsive by default:** semantic HTML, keyboard reachable, visible focus, labels on every field, 4.5:1 contrast, works from 360 px to 1440 px, respects `prefers-reduced-motion`.
7. **Follow the design.** `design/screenshots/*.png` and `design/mockups/*.html` define the look; `design/tokens.css` defines the tokens. Match them closely, then extend them consistently for screens that have no mockup.
8. **Stay inside the backend contract.** Do not invent endpoints or fields. If something is missing, follow `docs/09-backend-change-rules.md`.

## Stack (fixed; do not substitute)

React 19, Vite, TypeScript (strict), React Router (data router), TanStack Query, Tailwind CSS v4 with shadcn/ui (Radix) components, lucide-react, react-hook-form + zod, `openapi-typescript` + `openapi-fetch`, dnd-kit, Recharts, sonner, date-fns, Vitest + Testing Library + MSW, Playwright, ESLint (flat config) + Prettier, `@fontsource-variable/inter`.

Pin TypeScript to the newest 5.x or 6.x release that `typescript-eslint` supports. Do not install TypeScript 7.x: it has no JavaScript compiler API and breaks ESLint.

## Workflow

1. Create `frontend` git repo if missing. Work milestone by milestone as listed in `docs/01-scope.md`, in order.
2. Keep a task list. One milestone is done only when its acceptance list passes, `npm run check` is green, and you have **looked at the result** in a real browser (Playwright screenshot against the running backend with seed data) and compared it with the design.
3. Commit after every coherent unit of work with Conventional Commits (`feat(courses): add catalog filters`). Never mix frontend and backend changes in one commit; backend commits happen inside `../backend`. Do not push. Do not rewrite history.
4. Run `npm run check` before every commit. Never skip hooks or checks.
5. When a decision is not covered by the docs, choose the most conventional option, and record it in one line in `docs/DECISIONS.md` (create it). Do not stop to ask; only stop if you hit something that cannot be undone or needs credentials you do not have.
6. Start the backend yourself (`docs/08-local-environment.md`) and test against it, not against mocks, except in unit tests.
7. At the end produce `README.md` (run, env vars, scripts, structure, how to deploy) and a final report with what was built, what was verified, known gaps, and every backend change.

## Commands you will define (package.json)

`dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `check:comments`, `test`, `test:e2e`, `api:types` (regenerates the schema), `check` (typecheck + lint + format:check + check:comments + test + build).
