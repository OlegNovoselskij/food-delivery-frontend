import { Link } from "react-router";

import { Button } from "@/components/ui/button";

import { useAuth } from "../auth-provider";
import { UserMenu } from "./user-menu";

export function AccountActions() {
  const { session } = useAuth();

  if (session.status === "authenticated") return <UserMenu user={session.user} />;

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/sign-up">Get started</Link>
      </Button>
    </>
  );
}
