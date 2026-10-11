import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

import { Logo } from "./logo";
import type { NavItem } from "./nav-types";

interface TopbarProps {
  nav: readonly NavItem[];
  actions?: ReactNode;
  homeTo?: string;
}

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    "rounded-control px-3.5 py-2 text-body font-medium transition-colors",
    isActive ? "bg-sunken text-ink" : "text-muted hover:text-ink",
  );
}

function MobileNav({ nav }: { nav: readonly NavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="text-h3">Menu</SheetTitle>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {nav.map((item) => (
            <SheetClose asChild key={item.to}>
              <NavLink to={item.to} end={item.end ?? false} className={navLinkClass}>
                {item.label}
              </NavLink>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar({ nav, actions, homeTo = "/" }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-[68px] w-full max-w-[1400px] items-center gap-2 px-4 lg:px-6">
        {nav.length > 0 ? <MobileNav nav={nav} /> : null}
        <Link to={homeTo} aria-label="Atrium home" className="rounded-control">
          <Logo />
        </Link>
        {nav.length > 0 ? (
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end ?? false} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
