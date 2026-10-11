import { ChevronLeft, ListTree } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { AccountActions } from "@/features/auth";

interface PlayerHeaderProps {
  courseTitle: string;
  backTo: string;
  backLabel: string;
  percent: number | null;
  onOpenPath: () => void;
}

export function PlayerHeader({
  courseTitle,
  backTo,
  backLabel,
  percent,
  onOpenPath,
}: PlayerHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
      <Link
        to={backTo}
        aria-label={backLabel}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-control py-2 font-medium text-brand-700 hover:underline"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{backLabel}</span>
      </Link>
      <h2 className="min-w-0 flex-1 truncate pl-2 text-h3 font-semibold sm:pl-6">{courseTitle}</h2>
      {percent !== null ? (
        <p className="hidden shrink-0 text-muted sm:block">{percent}% complete</p>
      ) : null}
      <Button variant="secondary" size="sm" className="lg:hidden" onClick={onOpenPath}>
        <ListTree aria-hidden="true" />
        Your path
      </Button>
      <AccountActions />
    </header>
  );
}
