import { Lock } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { coursePath } from "@/lib/paths";
import { signInPathFor } from "@/lib/safe-redirect";

interface LessonLockedProps {
  courseId: number;
  signedIn: boolean;
  currentPath: string;
}

export function LessonLocked({ courseId, signedIn, currentPath }: LessonLockedProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={Lock}
        title="Enroll to open this lesson"
        description="This lesson is available to students enrolled in the course. Free preview lessons are marked on the course page."
        action={
          signedIn ? (
            <Button asChild>
              <Link to={coursePath(courseId)}>View course</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to={signInPathFor(currentPath)}>Sign in to continue</Link>
            </Button>
          )
        }
      />
    </div>
  );
}
