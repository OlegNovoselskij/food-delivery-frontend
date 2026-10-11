import { Outlet } from "react-router";

import { Footer } from "@/components/layout/footer";
import type { NavItem } from "@/components/layout/nav-types";
import { Topbar } from "@/components/layout/topbar";
import { AccountActions } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";

export const MAIN_CONTENT_ID = "main";

interface AppShellProps {
  nav: readonly NavItem[];
  homeTo?: string;
  withFooter?: boolean;
}

export function AppShell({ nav, homeTo = "/", withFooter = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        nav={nav}
        homeTo={homeTo}
        actions={
          <>
            <NotificationBell />
            <AccountActions />
          </>
        }
      />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="animate-route flex-1 outline-none">
        <Outlet />
      </main>
      {withFooter ? <Footer /> : null}
    </div>
  );
}
