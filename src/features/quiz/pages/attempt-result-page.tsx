import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import { toApiError } from "@/api/errors";
import { ScoreRing } from "@/components/domain/score-ring";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseId } from "@/lib/ids";
import { learnPath, quizPath } from "@/lib/paths";

import { attemptQuery } from "../api";
import { AttemptReview } from "../components/attempt-review";
import { ATTEMPT_STATUS } from "../status";

const HTTP_NOT_FOUND = 404;

function ResultSkeleton() {
  return (
    <div role="status" aria-label="Loading result" className="flex flex-col gap-4">
      <Skeleton className="h-40 rounded-panel" />
      <Skeleton className="h-48 rounded-card" />
      <Skeleton className="h-48 rounded-card" />
    </div>
  );
}

function ResultView({ attemptId, courseId }: { attemptId: number; courseId: number | null }) {
  const attempt = useQuery(attemptQuery(attemptId));
  const backTo = courseId === null ? "/learning" : learnPath(courseId);

  if (attempt.isPending) return <ResultSkeleton />;
  if (attempt.isError) {
    if (toApiError(attempt.error).status === HTTP_NOT_FOUND) {
      return (
        <EmptyState
          icon={Clock}
          title="Result not found"
          description="This attempt does not exist or belongs to another account."
          action={
            <Button asChild>
              <Link to="/learning">Back to my learning</Link>
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        error={attempt.error}
        title="Could not load the result"
        onRetry={() => {
          void attempt.refetch();
        }}
      />
    );
  }

  const result = attempt.data;
  const waiting = result.status === ATTEMPT_STATUS.pendingReview;
  const passed = result.passed === true;

  return (
    <>
      <title>{`${result.quiz_title} result · Atrium`}</title>
      <Link to={backTo} className="text-small font-semibold text-brand-700 hover:underline">
        Back to course
      </Link>
      <h1 className="mt-3 text-h1">{result.quiz_title}</h1>

      <section
        aria-label="Result"
        className="mt-8 flex flex-col items-start gap-6 rounded-panel border border-line bg-surface p-6 sm:flex-row sm:items-center"
      >
        {waiting || result.score === null ? (
          <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-ink">
            <Clock aria-hidden="true" className="size-10" />
          </span>
        ) : (
          <ScoreRing score={result.score} passed={passed} />
        )}
        <div>
          <h2 className="text-h2">
            {waiting ? "Waiting for your teacher" : passed ? "You passed" : "Not passed yet"}
          </h2>
          <p className="mt-2 max-w-prose text-muted">
            {waiting
              ? "Some answers are written and need your teacher's review. Your score will appear here as soon as they finish."
              : `You scored ${String(result.score)}% with ${String(result.points_earned)} of ${String(result.points_total)} points. The pass mark is ${result.passing_score}%.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to={backTo}>Continue course</Link>
            </Button>
            {!waiting && !passed ? (
              <Button asChild variant="secondary">
                <Link to={quizPath(result.quiz_id, courseId)}>Try again</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <h2 className="mt-10 mb-4 text-h2">Review your answers</h2>
      {result.review ? <AttemptReview review={result.review} /> : null}
    </>
  );
}

export function Component() {
  const { attemptId } = useParams();
  const [params] = useSearchParams();
  const parsedAttempt = parseId(attemptId);
  const courseId = parseId(params.get("course") ?? undefined);

  return (
    <div className="container-page max-w-3xl py-10">
      {parsedAttempt === null ? (
        <EmptyState
          icon={Clock}
          title="Result not found"
          description="The address of this result is not valid."
        />
      ) : (
        <ResultView attemptId={parsedAttempt} courseId={courseId} />
      )}
    </div>
  );
}
