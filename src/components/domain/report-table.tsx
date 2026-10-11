import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ReportTableProps {
  label: string;
  compact?: boolean;
  children: ReactNode;
}

export function ReportTable({ label, compact = false, children }: ReportTableProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table
        aria-label={label}
        className={cn("w-full border-collapse text-left", !compact && "min-w-[34rem]")}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2.5 text-small font-semibold whitespace-nowrap text-muted first:pl-0 last:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-line px-3 py-3 align-middle first:pl-0 last:pr-0", className)}
      {...props}
    />
  );
}
