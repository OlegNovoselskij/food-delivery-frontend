import { useQuery } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

import type { Review } from "@/api/types";
import { StarRow, formatRating } from "@/components/domain/rating";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/dates";
import { initials } from "@/lib/format";
import { totalPagesFor } from "@/lib/pagination";

import { REVIEWS_PAGE_SIZE, courseReviewsQuery, ownReviewQuery } from "../api";
import { useDeleteReview } from "../hooks";
import { ReviewForm } from "./review-form";

function authorLabel(review: Review): string {
  const { name, surname } = review.student;
  return `${name} ${surname.charAt(0)}.`;
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="flex gap-4 border-t border-line py-5 first:border-t-0 first:pt-0">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-small font-semibold text-brand-700"
      >
        {initials(review.student.name, review.student.surname)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-semibold">{authorLabel(review)}</p>
          <StarRow value={review.rating} />
          <time dateTime={review.created_at} className="text-small text-muted">
            {formatDate(review.created_at)}
          </time>
        </div>
        {review.comment ? <p className="mt-1.5 text-ink-soft">{review.comment}</p> : null}
      </div>
    </li>
  );
}

function OwnReview({ courseId, review }: { courseId: number; review: Review }) {
  const [editing, setEditing] = useState(false);
  const { remove, isPending } = useDeleteReview(courseId);

  if (editing) {
    return (
      <ReviewForm
        courseId={courseId}
        existing={review}
        onDone={() => {
          setEditing(false);
        }}
      />
    );
  }

  return (
    <section
      aria-label="Your review"
      className="rounded-card border border-brand-200 bg-brand-50 p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Your review</Badge>
        <StarRow value={review.rating} />
        <time dateTime={review.created_at} className="text-small text-muted">
          {formatDate(review.created_at)}
        </time>
      </div>
      {review.comment ? <p className="mt-2 text-ink-soft">{review.comment}</p> : null}
      <div className="mt-4 flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(true);
          }}
        >
          Edit review
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            void remove(review);
          }}
        >
          Delete review
        </Button>
      </div>
    </section>
  );
}

function ReviewComposer({ courseId, viewerId }: { courseId: number; viewerId: number }) {
  const own = useQuery(ownReviewQuery(courseId, viewerId, true));

  if (own.isPending || own.isError) return null;
  if (own.data) return <OwnReview courseId={courseId} review={own.data} />;
  return <ReviewForm courseId={courseId} existing={null} onDone={() => undefined} />;
}

function ReviewsSkeleton() {
  return (
    <div role="status" aria-label="Loading reviews" className="flex flex-col gap-5">
      <Skeleton className="h-16 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

interface ReviewsPanelProps {
  courseId: number;
  viewerId: number | null;
  canReview: boolean;
}

export function ReviewsPanel({ courseId, viewerId, canReview }: ReviewsPanelProps) {
  const [page, setPage] = useState(1);
  const reviews = useQuery(courseReviewsQuery(courseId, page));
  const composer =
    canReview && viewerId !== null ? (
      <div className="mb-8">
        <ReviewComposer courseId={courseId} viewerId={viewerId} />
      </div>
    ) : null;

  if (reviews.isPending) return <ReviewsSkeleton />;
  if (reviews.isError) {
    return (
      <ErrorState
        error={reviews.error}
        title="Could not load reviews"
        onRetry={() => {
          void reviews.refetch();
        }}
      />
    );
  }

  const { data } = reviews;
  if (data.total === 0) {
    return (
      <div>
        {composer}
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Reviews from students who took this course will appear here."
        />
      </div>
    );
  }

  const totalPages = totalPagesFor(data.total, REVIEWS_PAGE_SIZE);

  return (
    <div>
      {composer}
      {data.rating_avg !== null ? (
        <div className="mb-6 flex items-center gap-4">
          <p className="text-display font-bold">{formatRating(data.rating_avg)}</p>
          <div>
            <StarRow value={data.rating_avg} />
            <p className="text-small text-muted">
              Based on {data.reviews_count} {data.reviews_count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      ) : null}
      <ul>
        {data.items.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              setPage((current) => current - 1);
            }}
          >
            Previous
          </Button>
          <span className="text-small text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              setPage((current) => current + 1);
            }}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
