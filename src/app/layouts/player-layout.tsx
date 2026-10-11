import { Outlet } from "react-router";

import { MAIN_CONTENT_ID } from "./app-shell";

export function PlayerLayout() {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Outlet />
    </main>
  );
}
