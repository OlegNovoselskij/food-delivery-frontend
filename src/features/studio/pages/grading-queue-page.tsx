import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { Link } from "react-router";

import type { PendingReview } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/dates";
import { fullName } from "@/lib/format";
import { gradingAttemptPath } from "@/lib/paths";

import { pendingReviewsQuery } from "../grading/api";

function QueueSkeleton() {
  return (
    <div role="status" aria-label="Loading grading queue" className="flex flex-col gap-3">
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
    </div>
  );
}

function PendingRow({ item }: { item: PendingReview }) {
  return (
    <li>
      <article className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 font-semibold">{item.quiz_title}</h2>
          <p className="mt-1 text-small text-muted">
            {fullName(item.student)} · {item.course_title}
            {item.submitted_at ? ` · submitted ${formatRelative(item.submitted_at)}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link to={gradingAttemptPath(item.attempt_id)}>
            Review answers
            <span className="sr-only">
              {" "}
              from {fullName(item.student)} for {item.quiz_title}
            </span>
          </Link>
        </Button>
      </article>
    </li>
  );
}

export function Component() {
  const pending = useQuery(pendingReviewsQuery());

  return (
    <div className="container-page py-8">
      <title>Grading · Atrium</title>
      <h1 className="text-h1">Grading</h1>
      <p className="mt-1 mb-6 text-muted">Written answers that need your points.</p>
      {pending.isPending ? <QueueSkeleton /> : null}
      {pending.isError ? (
        <ErrorState
          error={pending.error}
          title="Could not load the grading queue"
          onRetry={() => {
            void pending.refetch();
          }}
        />
      ) : null}
      {pending.data?.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to grade"
          description="When a student submits a quiz with written answers, it shows up here."
        />
      ) : null}
      {pending.data && pending.data.length > 0 ? (
        <ul aria-label="Attempts waiting for review" className="flex flex-col gap-3">
          {pending.data.map((item) => (
            <PendingRow key={item.attempt_id} item={item} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
