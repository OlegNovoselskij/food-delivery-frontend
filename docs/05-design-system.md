# 05. Design system

The look is defined by `design/tokens.css` (Tailwind v4 `@theme` block plus a dark theme override) and the mockups. Open the screenshots first; this document explains the intent so you can extend it for screens without a mockup.

## Direction

A calm, confident study environment. Cool paper background, white surfaces separated by hairline borders instead of shadows, ink-coloured text, one saturated indigo for actions and progress, and amber used sparingly for emphasis (ratings, the logo mark, the playhead). The memorable element is **the path**: progress is always shown as a sequence of module segments (course cards, dashboard, player sidebar) and lessons as nodes on a vertical rail. Everything else stays quiet.

## Tokens

Copy `design/tokens.css` into `src/styles/` and import it in `index.css` after `@import "tailwindcss"`. Use the semantic Tailwind utilities that the tokens generate (`bg-paper`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand-600`, `text-brand-700`, `rounded-card`, and so on). Do not hard-code hex values in components.

| Group | Tokens | Use |
|---|---|---|
| Text | `ink`, `ink-soft`, `muted`, `faint` | headings and body, secondary, meta, disabled |
| Surfaces | `paper` (page), `surface` (cards), `sunken` (wells, module headers), `line`, `line-strong` | |
| Brand | `brand-50…900` | primary actions, links, progress, selection |
| Accent | `amber-400/500/50` | ratings, highlights, "resume" badge |
| Status | `success`, `danger`, `warning` (`-50` backgrounds, `-600` text/icons) | badges, validation, toasts |
| Radius | `control` 10 px, `card` 14 px, `panel` 20 px | inputs and buttons, cards, large panels and video |
| Shadow | `pop` for menus and dialogs only, `focus` ring | |

Dark theme: `[data-theme="dark"]` on `<html>` overrides the same tokens. Components must work in both without extra classes. Check both themes in screenshots for every page.

## Typography

One family: **Inter Variable** with optical sizing (display cuts apply automatically at large sizes through `font-optical-sizing: auto`). Scale tokens: `display` 40, `h1` 30, `h2` 22, `h3` 17, `body` 15, `small` 13, `micro` 12 px, with negative letter-spacing on headings. Weights 400, 500, 600, 650 for headings, 700 for prices and big numbers. Sentence case everywhere, no all-caps labels, no letter-spaced eyebrows. Body line length under 75 characters.

## Components

Build on shadcn/ui primitives (Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Tabs, Accordion, Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Sheet, Skeleton, Badge, Progress, Table, Form, Sonner) restyled to the tokens, then add these domain components in `src/components/`:

| Component | Notes |
|---|---|
| `Logo` | Ink rounded square with an amber rotated diamond, wordmark "Atrium" |
| `CourseCard`, `CourseCover` | Generated cover from the id when there is no image; same six palettes as the mockups |
| `ProgressTrack` | Segmented bar, one segment per module, supports partial fill; used with an accessible `role="progressbar"` and text alternative |
| `PathRail`, `PathNode` | The vertical lesson rail; states done, current, upcoming, quiz, locked |
| `Rating` | Read-only stars (amber) and input mode |
| `PriceTag` | Formats decimal strings, shows "Free" |
| `CodeInput` | Six-box one-time code field |
| `StatCard`, `KpiGrid` | Number, label, trend |
| `EmptyState`, `ErrorState`, `PageSkeleton` | Consistent state components |
| `ConfirmDialog` | Promise-based hook `useConfirm()` |
| `DataTable` | Sortable, with loading and empty states, CSV button slot |
| `FileDropzone` | Drag and drop plus button, validation, progress, cancel |
| `Chart` wrappers | Recharts line, bar with tokens, title, summary and table fallback |
| `RoleGate`, `Can` | Role-based rendering |

Buttons: heights 32 (sm), 40 (default), 48 (lg); primary is brand-600 with white text; secondary is white with `line-strong` border; ghost is transparent. Chips are pill-shaped with an ink fill when selected. Badges are 22 px tall, 6 px radius, tinted background plus matching text. Inputs are 44 px tall with 10 px radius. Cards are white, 1 px `line` border, 14 px radius, no shadow.

## Layout

12-column feel on a 1216 px content width (max-w with 32 px gutters on desktop, 16 px on mobile). Spacing on a 4 px scale; sections separated by 32 to 48 px. Left-aligned text everywhere. Sticky elements: the enroll card on course detail, the Path sidebar in the player.

## Motion

Almost none. Allowed: a single short fade for route content, dialog and menu open and close, accordion expand, progress segments filling when a lesson is completed (200 ms), the upload progress bar. Everything off under `prefers-reduced-motion`. No entrance animations per section, no hover lifts on cards.

## Voice

Plain verbs, specific labels, sentence case. Examples: "Enroll in course", "Continue lesson", "Mark as complete", "Publish course", "Export CSV". Empty states invite an action ("No certificates yet. Finish a course to earn one."). Errors are factual and never apologise ("Code is incorrect. 3 attempts left.").

## Accessibility

Contrast 4.5:1 for text and 3:1 for UI in both themes; visible focus ring (`shadow-focus`) on every interactive element; hit targets at least 40 px on touch; icons that carry meaning have labels; colour is never the only signal (node states also differ in shape, badges have text).
