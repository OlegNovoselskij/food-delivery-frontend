import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

interface LessonActionsProps {
  canTrackProgress: boolean;
  completed: boolean;
  pending: boolean;
  onToggle: () => void;
  nextHref: string | null;
}

export function LessonActions({
  canTrackProgress,
  completed,
  pending,
  onToggle,
  nextHref,
}: LessonActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {canTrackProgress ? (
        <Button variant="secondary" size="lg" disabled={pending} onClick={onToggle}>
          {completed ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
          {completed ? "Mark as incomplete" : "Mark as complete"}
        </Button>
      ) : null}
      {nextHref !== null ? (
        <Button asChild size="lg">
          <Link to={nextHref}>
            Next lesson
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
