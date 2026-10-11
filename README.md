# Atrium frontend

Web client of the Atrium online education platform. React 19, Vite, TypeScript, Tailwind CSS v4.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dev server runs on `http://localhost:5173` and expects the backend on `http://localhost:8000`.

## Scripts

| Script              | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Start the dev server                                               |
| `npm run build`     | Type-check and build to `dist`                                     |
| `npm run check`     | Typecheck, lint, format check, comment check, unit tests and build |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from the running backend          |
| `npm run test:e2e`  | Playwright end-to-end tests against the real backend               |
