import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/cn";
import { pageWindow } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}

const itemClass =
  "flex size-10 items-center justify-center rounded-control border border-line bg-surface text-body font-semibold text-ink-soft hover:bg-sunken";

export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap justify-center gap-2", className)}>
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} aria-label="Previous page" className={itemClass}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((entry, index) =>
        entry === null ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="flex size-10 items-center justify-center text-muted"
          >
            …
          </span>
        ) : (
          <Link
            key={entry}
            to={hrefFor(entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(itemClass, entry === page && "border-ink bg-ink text-paper hover:bg-ink")}
          >
            {entry}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link to={hrefFor(page + 1)} aria-label="Next page" className={itemClass}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
