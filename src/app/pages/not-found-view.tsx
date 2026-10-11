import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export function NotFoundView() {
  return (
    <div className="container-page flex flex-col items-start gap-4 py-20">
      <p className="text-display font-bold tracking-tight text-brand-600">404</p>
      <h1 className="text-h1">Page not found</h1>
      <p className="max-w-prose text-muted">
        The page you are looking for does not exist or has moved. Check the address or go back to
        the home page.
      </p>
      <Button asChild>
        <Link to="/">Go to home page</Link>
      </Button>
    </div>
  );
}
