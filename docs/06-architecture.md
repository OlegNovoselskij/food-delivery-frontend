# 06. Architecture and code standards

## Folder structure (feature-sliced, flat inside features)

```
src/
  app/                 providers, router, route tree, layouts, error boundary
  api/                 client.ts, errors.ts, schema.d.ts (generated), query-keys helpers
  config/              env.ts (zod-validated)
  features/
    auth/              api.ts, hooks.ts, store.ts, components/, pages/
    catalog/
    course/
    learning/
    quiz/
    certificates/
    notifications/     socket.ts (reconnecting WebSocket), provider.tsx
    studio/            builder/, quiz-builder/, analytics/
    admin/
    profile/
    reviews/
    recommendations/
  components/
    ui/                shadcn primitives (restyled)
    domain/            CourseCard, ProgressTrack, PathRail, ...
    layout/            Topbar, Footer, PageHeader
    feedback/          EmptyState, ErrorState, Skeletons
  hooks/               generic hooks (useDebounce, useCountdown, useMediaQuery)
  lib/                 pure utilities (format, dates, money, files, cn)
  styles/              index.css, tokens.css
  test/                setup, MSW handlers, factories, render helpers
e2e/                   Playwright specs and fixtures
```

Rules: a feature imports from `components`, `lib`, `hooks`, `api`, `config`; features never import from each other's internals, only from a feature's `index.ts` public exports. Pages are thin: they read route params, call hooks, compose components. Business logic lives in hooks and `lib`, never in JSX. Named exports only (default exports only for lazy route modules if you need them). One component per file, file name equals component name in kebab-case (`course-card.tsx`).

## Data layer

- TanStack Query for all server state. No server data in React state or global stores.
- `queryOptions` factories per feature (`courseQueries.detail(id)`), shared between hooks, route loaders (prefetch for critical routes) and tests.
- Mutations are hooks (`useEnrollMutation`) that own invalidation and toasts through a small shared helper so components stay declarative.
- Optimistic updates for progress completion and drag-and-drop reordering, with rollback on error and reconciliation with the response.
- Zustand is not required. Client state: auth token (small store with `useSyncExternalStore`), theme, UI toggles. Keep it minimal.
- Forms: react-hook-form with zod resolvers; schemas in `schemas.ts` next to the form; server 422 errors mapped to fields by a shared helper.

## Routing

React Router data router with `createBrowserRouter`. Lazy route modules (`lazy`) per page. Guards as layout routes (`RequireAuth`, `RequireRole`, `GuestOnly`). Route params validated with zod before use. Scroll restoration and focus-to-heading on navigation.

## Error handling

Single `ApiError` type. Query errors surface through `ErrorState`; mutation errors through toasts or field errors. A top-level error boundary renders the crash page and shows the request id when available. No silent `catch`. No `try/catch` that only logs.

## TypeScript standards

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- No `any`, no unchecked casts. Narrow with type guards or zod. Use discriminated unions for quiz questions, enrollment status, upload state, socket state.
- API types from `schema.d.ts` via small aliases (`type Course = components["schemas"]["CourseOut"]`) defined once in `src/api/types.ts`.
- Constants in `as const` objects; enums for backend values come from the schema, not retyped strings.
- Functions are small and named for what they return; components under about 150 lines, split when larger; hooks under about 80.

## React standards

- Function components, hooks only, React 19 features where they simplify (`use`, actions) but do not force them.
- Derive, do not sync: no `useEffect` for derived state. Effects only for subscriptions, timers, DOM integration.
- Memoise only after measuring; lists have stable keys.
- Accessibility wired into components, not bolted on: labels, `aria-*` on custom controls, focus traps from Radix.
- Images and video have explicit dimensions or aspect ratios to avoid layout shift; lazy-load below the fold.

## Performance

Route-level code splitting, Recharts and the studio builder in their own chunks, prefetch on link hover for course pages, `staleTime` tuned per query (catalog 60 s, program 5 min, progress 0, notifications 0), debounce search (300 ms), virtualisation not needed unless a list exceeds 200 rows.

## Security

Token in `localStorage` is an accepted trade-off for this API (bearer tokens, no cookies); mitigate with strict CSP in nginx (`default-src 'self'`; allow the API origin, the storage origin, Google scripts and frames, `img-src` for course covers), no `dangerouslySetInnerHTML` (use text), sanitised links (only `http(s)`), never log tokens, strip the token on sign out and on 401. Escape nothing manually; React does it.

## Docker and serving

`Dockerfile`: stage 1 `node:22-alpine` installs with `npm ci`, builds with build-args for `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`; stage 2 `nginx:alpine` copies `dist` and `nginx.conf` (SPA fallback to `index.html`, `Cache-Control: public, max-age=31536000, immutable` for `/assets`, `no-cache` for `index.html`, gzip, security headers, CSP). Expose 80. Non-root where practical. Health at `/healthz` returning 200.
