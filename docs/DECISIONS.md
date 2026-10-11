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
- Tokens `success-ink`, `danger-ink` and `warning-ink` (with dark overrides) are added for text because `*-600` fails 4.5:1 as small text; `*-600` stays for icons and borders.
- E2E users use `@demo.example.com` addresses because the backend email validator rejects `.test` domains.
- The profile page (name, surname, phone, bio, sessions) is built in M1 so the protected-route and sign-out acceptance can be verified in a browser; M9 adds the theme toggle to it.
- Forgot and reset password pages are open to signed-in users too, because the profile page links to them for sign out everywhere.
- `jsx-a11y/media-has-caption` is turned off for the lesson video component in the ESLint config because the API has no captions or subtitle tracks.
- The player is a route layout without a footer; the lesson page renders its own slim header, and visitors can open preview lessons without signing in.
