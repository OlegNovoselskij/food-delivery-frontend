import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

interface FormErrorProps {
  message: string | undefined;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-control bg-danger-50 px-3 py-2.5 text-small text-danger-ink",
        className,
      )}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
