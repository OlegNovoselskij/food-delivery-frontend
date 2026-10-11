import { readStorage, writeStorage } from "@/lib/safe-storage";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "atrium.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

type Listener = () => void;

const listeners = new Set<Listener>();

function isPreference(value: string | null): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

function readPreference(): ThemePreference {
  const stored = readStorage(THEME_KEY);
  return isPreference(stored) ? stored : "system";
}

function applyTheme(): void {
  document.documentElement.dataset.theme = resolveTheme(readPreference(), systemPrefersDark());
}

function notify(): void {
  applyTheme();
  listeners.forEach((listener) => {
    listener();
  });
}

export const themeStore = {
  getPreference: readPreference,
  getResolved: (): ResolvedTheme => resolveTheme(readPreference(), systemPrefersDark()),
  setPreference: (preference: ThemePreference): void => {
    writeStorage(THEME_KEY, preference);
    notify();
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    const media = window.matchMedia(DARK_QUERY);
    media.addEventListener("change", notify);
    return () => {
      listeners.delete(listener);
      media.removeEventListener("change", notify);
    };
  },
  apply: applyTheme,
};
