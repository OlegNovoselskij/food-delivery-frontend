import { LogOut } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSignOut, useUser } from "@/features/auth";

import { ProfileForm } from "../components/profile-form";

export function Component() {
  const user = useUser();
  const signOut = useSignOut();

  return (
    <div className="container-page max-w-3xl py-10">
      <title>Profile · Atrium</title>
      <h1 className="text-h1">Profile</h1>
      <p className="mt-2 text-muted">Update how you appear on Atrium.</p>

      <section className="mt-8 rounded-card border border-line bg-surface p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-small text-muted">Email</p>
            <p className="truncate font-semibold">{user.email}</p>
          </div>
          <Badge tone="brand" className="capitalize">
            {user.role}
          </Badge>
        </div>
        <ProfileForm user={user} />
      </section>

      <section className="mt-6 rounded-card border border-line bg-surface p-6">
        <h2 className="text-h3">Sessions</h2>
        <p className="mt-2 max-w-prose text-muted">
          Sign out on this device here. To sign out on every device, reset your password: all
          previous sessions stop working right away.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
          <Button asChild variant="ghost">
            <Link to="/forgot-password">Reset password</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
