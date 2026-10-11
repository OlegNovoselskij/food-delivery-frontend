import { Toaster as SonnerToaster } from "sonner";

import { useTheme } from "@/hooks/use-theme";

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-card !border !border-line !bg-surface !text-ink !shadow-pop !font-sans",
          description: "!text-muted",
        },
      }}
    />
  );
}
