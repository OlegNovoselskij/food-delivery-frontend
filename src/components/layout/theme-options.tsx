import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: LucideIcon }> = {
  system: { label: "System", icon: Monitor },
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
};

function isPreference(value: string): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

export function ThemeOptions() {
  const { preference, setPreference } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="text-small font-semibold text-muted">Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={preference}
        onValueChange={(value) => {
          if (isPreference(value)) setPreference(value);
        }}
      >
        {THEME_PREFERENCES.map((value) => {
          const { label, icon: Icon } = THEME_OPTIONS[value];
          return (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}
