export const SEEK_SECONDS = 5;

export type PlayerShortcut = "toggle-play" | "seek-back" | "seek-forward" | "toggle-mute";

const SHORTCUTS: Record<string, PlayerShortcut> = {
  " ": "toggle-play",
  ArrowLeft: "seek-back",
  ArrowRight: "seek-forward",
  m: "toggle-mute",
  M: "toggle-mute",
};

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "VIDEO"]);
const INTERACTIVE_ROLES = new Set(["tab", "menuitem", "option", "radio", "checkbox", "slider"]);

export function shortcutFor(key: string): PlayerShortcut | null {
  return SHORTCUTS[key] ?? null;
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (INTERACTIVE_TAGS.has(target.tagName)) return true;
  const role = target.getAttribute("role");
  return role !== null && INTERACTIVE_ROLES.has(role);
}

export function shouldApplyVideoUrl(
  currentUrl: string | null,
  nextUrl: string,
  isPlaying: boolean,
): boolean {
  if (currentUrl === null) return true;
  return currentUrl !== nextUrl && !isPlaying;
}

export function clampSeek(current: number, delta: number, duration: number): number {
  const target = current + delta;
  if (!Number.isFinite(duration)) return Math.max(0, target);
  return Math.min(Math.max(0, target), duration);
}
