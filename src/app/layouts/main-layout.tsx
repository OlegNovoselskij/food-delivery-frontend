import { useAuth } from "@/features/auth";

import { mainNavFor } from "../navigation";
import { AppShell } from "./app-shell";

export function MainLayout() {
  const { session } = useAuth();
  return <AppShell nav={mainNavFor(session)} />;
}
