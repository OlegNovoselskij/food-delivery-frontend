import type { NavItem } from "@/components/layout/nav-types";

import { AppShell } from "./app-shell";

const PUBLIC_NAV: readonly NavItem[] = [];

export function PublicLayout() {
  return <AppShell nav={PUBLIC_NAV} />;
}
