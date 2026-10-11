import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export function Component() {
  return (
    <div className="container-page flex flex-col items-start gap-4 py-20">
      <title>No access · Atrium</title>
      <p className="text-display font-bold tracking-tight text-brand-600">403</p>
      <h1 className="text-h1">You do not have access to this page</h1>
      <p className="max-w-prose text-muted">
        Your account role cannot open this page. Go back to the home page or sign in with a
        different account.
      </p>
      <Button asChild>
        <Link to="/">Go to home page</Link>
      </Button>
    </div>
  );
}
