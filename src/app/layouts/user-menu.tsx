import { LogOut, UserRound } from "lucide-react";
import { Link } from "react-router";

import type { User } from "@/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth";
import { initials } from "@/lib/format";

export function UserMenu({ user }: { user: User }) {
  const signOut = useSignOut();
  const fullName = `${user.name} ${user.surname}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="flex size-[38px] items-center justify-center rounded-full bg-brand-100 text-small font-semibold text-brand-700"
      >
        {initials(user.name, user.surname)}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="font-semibold text-ink">{fullName}</p>
          <p className="text-small text-muted">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
