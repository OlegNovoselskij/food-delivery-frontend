import type { ReactNode } from "react";
import { Outlet } from "react-router";

import { Footer } from "@/components/layout/footer";
import type { NavItem } from "@/components/layout/nav-types";
import { Topbar } from "@/components/layout/topbar";

export const MAIN_CONTENT_ID = "main";

interface AppShellProps {
  nav: readonly NavItem[];
  actions?: ReactNode;
  homeTo?: string;
  withFooter?: boolean;
}

export function AppShell({ nav, actions, homeTo, withFooter = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar nav={nav} homeTo={homeTo ?? "/"} actions={actions} />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="animate-route flex-1 outline-none">
        <Outlet />
      </main>
      {withFooter ? <Footer /> : null}
    </div>
  );
}
