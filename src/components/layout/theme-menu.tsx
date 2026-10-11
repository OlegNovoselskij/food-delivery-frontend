import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";

import { ThemeOptions } from "./theme-options";

export function ThemeMenu({ className }: { className?: string | undefined }) {
  const { resolved } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme" className={className}>
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeOptions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
