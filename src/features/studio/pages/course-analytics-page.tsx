import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

import { toApiError } from "@/api/errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { courseDetailQuery } from "@/features/course";
import { parseId } from "@/lib/ids";

import { FunnelSection } from "../analytics/components/funnel-section";
import { QuestionsSection } from "../analytics/components/questions-section";
import { QuizzesSection } from "../analytics/components/quizzes-section";
import { StudentsSection } from "../analytics/components/students-section";
import { CourseStatusBadge } from "../components/course-status-badge";

const HTTP_NOT_FOUND = 404;

function NotFound() {
  return (
    <div className="container-page py-10">
      <EmptyState
        icon={SearchX}
        title="Course not found"
        description="This course does not exist or belongs to another teacher."
        action={
          <Button asChild>
            <Link to="/studio">Back to teaching</Link>
          </Button>
        }
      />
    </div>
  );
}

function AnalyticsView({ courseId }: { courseId: number }) {
  const course = useQuery({ ...courseDetailQuery(courseId), staleTime: 0 });

  if (course.isPending) {
    return (
      <div role="status" aria-label="Loading analytics" className="container-page py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-9 w-2/3 max-w-xl" />
        <Skeleton className="mt-8 h-56 rounded-panel" />
      </div>
    );
  }
  if (course.isError) {
    if (toApiError(course.error).status === HTTP_NOT_FOUND) return <NotFound />;
    return (
      <div className="container-page py-10">
        <ErrorState
          error={course.error}
          title="Could not load this course"
          onRetry={() => {
            void course.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-6 py-8">
      <title>{`Analytics for ${course.data.title} · Atrium`}</title>
      <header>
        <Button asChild variant="link">
          <Link to="/studio">
            <ArrowLeft aria-hidden="true" />
            Back to teaching
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-h1">{course.data.title}</h1>
          <CourseStatusBadge status={course.data.status} />
        </div>
        <p className="mt-1 text-muted">Course analytics</p>
      </header>
      <FunnelSection courseId={courseId} />
      <QuizzesSection courseId={courseId} />
      <QuestionsSection courseId={courseId} />
      <StudentsSection courseId={courseId} />
    </div>
  );
}

export function Component() {
  const params = useParams();
  const courseId = parseId(params.courseId);
  return courseId === null ? <NotFound /> : <AnalyticsView courseId={courseId} />;
}
