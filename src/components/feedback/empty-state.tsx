import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-dashed border-line-strong bg-surface p-8",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2 className="text-h3">{title}</h2>
      <p className="max-w-prose text-muted">{description}</p>
      {action}
    </div>
  );
}
