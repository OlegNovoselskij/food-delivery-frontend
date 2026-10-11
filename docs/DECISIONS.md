# Decisions

One line per decision where the docs were silent.

- The sibling backend folder is named `food-delivery-backend` and the frontend repository root is `food-delivery-frontend`; they stand for `../backend` and `frontend/` in the docs.
- ESLint is pinned to 9 because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet.
- TypeScript is pinned to 5.9, the newest 5.x supported by `typescript-eslint`.
- shadcn/ui components are written by hand into `src/components/ui` on the `radix-ui` package with `components.json` present, instead of running the interactive CLI.
- A `--color-on-brand` token is added next to the design tokens so primary buttons stay readable in the dark theme, where `brand-600` is light.
- `tailwind-merge` is configured with the custom font size tokens (`text-body`, `text-small`, and so on), otherwise it drops text colors that sit next to them.
- The API client throws a normalized `ApiError` from a response middleware, so every query and mutation fails through one path.
- The root layout focuses the page `h1` after each navigation, and renders a skip link.
- The theme is `system`, `light` or `dark`, stored in `localStorage`, and applied before first paint by `public/theme-init.js` because the CSP forbids inline scripts.
- Pages are lazy route modules that export a named `Component`, so there are no default exports in the app.
- The nginx image reads `API_ORIGIN`, `API_WS_ORIGIN` and `STORAGE_ORIGIN` at container start to build the CSP.
