import { Link, Outlet } from "react-router";

import { Logo } from "@/components/layout/logo";

import { MAIN_CONTENT_ID } from "./app-shell";

function AuthAside() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden flex-col justify-end overflow-hidden bg-night p-16 text-on-night lg:flex"
    >
      <span className="absolute -top-44 -right-40 size-[560px] rounded-full bg-night-brand" />
      <span className="absolute top-[46%] -left-24 size-64 rounded-full bg-amber-500" />
      <p className="relative z-10 max-w-md text-[26px] leading-tight font-semibold tracking-tight">
        “I finished a course in the evenings and verified my certificate with one link.”
      </p>
      <div className="relative z-10 mt-5 flex items-center gap-3">
        <span className="flex size-[34px] items-center justify-center rounded-full bg-on-night text-small font-semibold text-night-brand">
          MP
        </span>
        <p className="text-small">
          Maria P.
          <span className="block text-micro opacity-70">Backend developer</span>
        </p>
      </div>
    </aside>
  );
}

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-surface px-6 py-12 sm:px-[clamp(2rem,8vw,7.5rem)]">
        <Link to="/" aria-label="Atrium home" className="mb-14 self-start rounded-control">
          <Logo />
        </Link>
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="animate-route w-full max-w-[400px] outline-none"
        >
          <Outlet />
        </main>
      </div>
      <AuthAside />
    </div>
  );
}
