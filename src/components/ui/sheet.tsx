import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;

interface SheetContentProps extends ComponentProps<typeof Dialog.Content> {
  side?: "left" | "right";
}

export function SheetContent({ className, children, side = "left", ...props }: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(24rem,90vw)] flex-col gap-4 overflow-y-auto border-line bg-surface p-5 shadow-pop",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          aria-label="Close menu"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-control text-ink-soft hover:bg-sunken"
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
