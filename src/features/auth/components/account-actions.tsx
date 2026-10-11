import { Link } from "react-router";

import { ThemeMenu } from "@/components/layout/theme-menu";
import { Button } from "@/components/ui/button";

import { useAuth } from "../auth-provider";
import { UserMenu } from "./user-menu";

export function AccountActions({ compact = false }: { compact?: boolean }) {
  const { session } = useAuth();

  if (session.status === "authenticated") return <UserMenu user={session.user} />;

  return (
    <>
      <ThemeMenu className={compact ? "hidden sm:inline-flex" : undefined} />
      <Button asChild variant="ghost" size="sm">
        <Link to="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/sign-up">Get started</Link>
      </Button>
    </>
  );
}
