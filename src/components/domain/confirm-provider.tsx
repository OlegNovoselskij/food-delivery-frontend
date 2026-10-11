import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

const DEFAULT_CANCEL_LABEL = "Keep it";

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<Confirm>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        {options ? (
          <AlertDialogContent>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <AlertDialogCancel>{options.cancelLabel ?? DEFAULT_CANCEL_LABEL}</AlertDialogCancel>
              <AlertDialogAction
                tone={options.tone ?? "primary"}
                onClick={() => {
                  settle(true);
                }}
              >
                {options.confirmLabel}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </ConfirmContext>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (confirm === null) throw new Error("useConfirm must be used inside ConfirmProvider");
  return confirm;
}
