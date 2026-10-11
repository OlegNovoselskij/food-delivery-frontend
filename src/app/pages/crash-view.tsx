import { toApiError } from "@/api/errors";
import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export function CrashView({ error }: { error: unknown }) {
  const { requestId } = toApiError(error);
  return (
    <main className="container-page flex min-h-screen flex-col items-start justify-center gap-4 py-16">
      <LogoMark />
      <h1 className="text-h1">Something went wrong</h1>
      <p className="max-w-prose text-muted">
        The page could not be shown because of an unexpected error. Reload the page. If it keeps
        happening, contact support and quote the request ID below.
      </p>
      {requestId ? <p className="text-small text-muted">Request ID: {requestId}</p> : null}
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload page
      </Button>
    </main>
  );
}
