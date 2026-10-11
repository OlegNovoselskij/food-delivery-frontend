import { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";

import { MAIN_CONTENT_ID } from "./app-shell";

function focusMainContent(): void {
  const main = document.getElementById(MAIN_CONTENT_ID);
  if (main === null) return;
  const heading = main.querySelector<HTMLElement>("h1");
  if (heading !== null) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    return;
  }
  main.focus({ preventScroll: true });
}

export function RootLayout() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    focusMainContent();
  }, [pathname]);

  return (
    <>
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only rounded-control bg-surface px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
