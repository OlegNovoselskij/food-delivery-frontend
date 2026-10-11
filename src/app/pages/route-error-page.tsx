import { isRouteErrorResponse, useRouteError } from "react-router";

import { CrashView } from "./crash-view";
import { NotFoundView } from "./not-found-view";

const HTTP_NOT_FOUND = 404;

export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === HTTP_NOT_FOUND) return <NotFoundView />;
  return <CrashView error={error} />;
}
