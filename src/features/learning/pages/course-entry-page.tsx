import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Button } from "@/components/ui/button";
import { canLearn, useCourseEnrollment } from "@/features/enrollment";
import { parseId } from "@/lib/ids";
import { coursePath, lessonPath } from "@/lib/paths";

import { progressQuery } from "../api";
import { orderedLessonIds } from "../progress-model";

function EntryView({ courseId }: { courseId: number }) {
  const enrollment = useCourseEnrollment(courseId);
  const enrollmentId = enrollment.data?.id ?? 0;
  const learnable = enrollment.data ? canLearn(enrollment.data.status) : false;
  const progress = useQuery(progressQuery(enrollmentId, learnable));

  if (enrollment.isError || progress.isError) {
    return (
      <div className="container-page py-10">
        <ErrorState
          error={enrollment.error ?? progress.error}
          title="Could not open the course"
          onRetry={() => {
            void enrollment.refetch();
            void progress.refetch();
          }}
        />
      </div>
    );
  }

  if (enrollment.isPending) return <PageSkeleton />;
  if (!learnable) return <Navigate to={coursePath(courseId)} replace />;
  if (!progress.data) return <PageSkeleton />;

  const [firstLessonId] = orderedLessonIds(progress.data);
  const target = progress.data.next_lesson_id ?? firstLessonId;
  if (target === undefined) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={SearchX}
          title="This course has no lessons yet"
          description="The teacher is still building the program. Check back soon."
          action={
            <Button asChild>
              <Link to="/learning">Back to my learning</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return <Navigate to={lessonPath(courseId, target)} replace />;
}

export function Component() {
  const { courseId } = useParams();
  const parsed = parseId(courseId);
  if (parsed === null) return <Navigate to="/learning" replace />;
  return <EntryView courseId={parsed} />;
}
