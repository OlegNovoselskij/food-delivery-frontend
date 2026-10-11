import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

import { toApiError } from "@/api/errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ATTEMPT_STATUS, attemptQuery } from "@/features/quiz";
import { fullName } from "@/lib/format";
import { parseId } from "@/lib/ids";
import { GRADING_PATH } from "@/lib/paths";

import { pendingReviewsQuery } from "../grading/api";
import { GradingForm } from "../grading/components/grading-form";
import { answersToGrade } from "../grading/grading-schema";

const HTTP_NOT_FOUND = 404;

function BackLink() {
  return (
    <Button asChild variant="link">
      <Link to={GRADING_PATH}>
        <ArrowLeft aria-hidden="true" />
        Back to grading
      </Link>
    </Button>
  );
}

function AttemptSkeleton() {
  return (
    <div role="status" aria-label="Loading answers" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-2/3 max-w-xl" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Attempt not found"
      description="This attempt does not exist or belongs to another teacher's course."
      action={
        <Button asChild>
          <Link to={GRADING_PATH}>Back to grading</Link>
        </Button>
      }
    />
  );
}

function AttemptView({ attemptId }: { attemptId: number }) {
  const attempt = useQuery(attemptQuery(attemptId));
  const pending = useQuery(pendingReviewsQuery());
  const context = pending.data?.find((item) => item.attempt_id === attemptId);

  if (attempt.isPending) return <AttemptSkeleton />;
  if (attempt.isError) {
    if (toApiError(attempt.error).status === HTTP_NOT_FOUND) return <NotFound />;
    return (
      <ErrorState
        error={attempt.error}
        title="Could not load these answers"
        onRetry={() => {
          void attempt.refetch();
        }}
      />
    );
  }

  const items = answersToGrade(attempt.data.review ?? []);
  const waiting = attempt.data.status === ATTEMPT_STATUS.pendingReview && items.length > 0;

  return (
    <>
      <title>{`Review ${attempt.data.quiz_title} · Atrium`}</title>
      <h1 className="mt-3 text-h1">{attempt.data.quiz_title}</h1>
      <p className="mt-1 mb-6 text-muted">
        {context ? `${fullName(context.student)} · ${context.course_title}` : "Written answers"}
      </p>
      {waiting ? (
        <GradingForm attemptId={attemptId} items={items} />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Already graded"
          description="Every written answer in this attempt has points. Nothing is left to review."
          action={
            <Button asChild>
              <Link to={GRADING_PATH}>Back to grading</Link>
            </Button>
          }
        />
      )}
    </>
  );
}

export function Component() {
  const params = useParams();
  const attemptId = parseId(params.attemptId);

  return (
    <div className="container-page max-w-3xl py-8">
      <BackLink />
      {attemptId === null ? <NotFound /> : <AttemptView attemptId={attemptId} />}
    </div>
  );
}
