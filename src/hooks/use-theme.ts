import { useSyncExternalStore } from "react";

import { themeStore, type ResolvedTheme, type ThemePreference } from "@/lib/theme";

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export function useTheme(): ThemeState {
  const preference = useSyncExternalStore(themeStore.subscribe, themeStore.getPreference);
  const resolved = useSyncExternalStore(themeStore.subscribe, themeStore.getResolved);
  return { preference, resolved, setPreference: themeStore.setPreference };
}
