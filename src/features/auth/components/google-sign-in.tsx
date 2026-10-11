import { useEffect, useRef } from "react";

import { env } from "@/config/env";
import { notify } from "@/lib/notify";

import { requestGoogleNonce } from "../api";
import { loadGoogleIdentity } from "../google";
import { useGoogleSignInMutation } from "../hooks";
import { SELF_SERVICE_ROLE } from "../schemas";

function GoogleButton() {
  const container = useRef<HTMLDivElement>(null);
  const { mutate } = useGoogleSignInMutation();

  useEffect(() => {
    let cancelled = false;

    async function mount(): Promise<void> {
      await loadGoogleIdentity();
      const { nonce } = await requestGoogleNonce();
      const target = container.current;
      if (cancelled || target === null) return;
      google.accounts.id.initialize({
        client_id: env.googleClientId,
        nonce,
        callback: ({ credential }) => {
          mutate({ credential, role: SELF_SERVICE_ROLE }, { onError: notify.error });
        },
      });
      google.accounts.id.renderButton(target, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: target.clientWidth,
      });
    }

    mount().catch(notify.error);

    return () => {
      cancelled = true;
    };
  }, [mutate]);

  return <div ref={container} className="flex min-h-12 justify-center" />;
}

export function GoogleSignIn() {
  if (env.googleClientId === "") return null;
  return (
    <>
      <div className="flex items-center gap-3.5 text-small text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />
    </>
  );
}
