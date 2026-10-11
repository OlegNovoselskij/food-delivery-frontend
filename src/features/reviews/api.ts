import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { rootKeys } from "@/api/query-keys";
import type { ReviewCreate, ReviewUpdate } from "@/api/types";
import { unwrap, unwrapEmpty } from "@/api/unwrap";

const REVIEWS_STALE_TIME_MS = 60_000;
export const REVIEWS_PAGE_SIZE = 10;
const OWN_REVIEW_LOOKUP_SIZE = 100;

export const reviewKeys = {
  list: (courseId: number, page: number) =>
    [...rootKeys.course(courseId), "reviews", page] as const,
  own: (courseId: number, userId: number) =>
    [...rootKeys.course(courseId), "reviews", "own", userId] as const,
  courseRoot: (courseId: number) => [...rootKeys.course(courseId), "reviews"] as const,
};

export function courseReviewsQuery(courseId: number, page: number) {
  return queryOptions({
    queryKey: reviewKeys.list(courseId, page),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/courses/{course_id}/reviews", {
          params: { path: { course_id: courseId }, query: { page, size: REVIEWS_PAGE_SIZE } },
        }),
      ),
    staleTime: REVIEWS_STALE_TIME_MS,
  });
}

export function ownReviewQuery(courseId: number, userId: number, enabled: boolean) {
  return queryOptions({
    queryKey: reviewKeys.own(courseId, userId),
    queryFn: async () => {
      const page = await unwrap(
        api.GET("/api/v1/courses/{course_id}/reviews", {
          params: {
            path: { course_id: courseId },
            query: { page: 1, size: OWN_REVIEW_LOOKUP_SIZE },
          },
        }),
      );
      return page.items.find((review) => review.student.id === userId) ?? null;
    },
    enabled,
    staleTime: 0,
  });
}

export function createReview(courseId: number, body: ReviewCreate) {
  return unwrap(
    api.POST("/api/v1/courses/{course_id}/reviews", {
      params: { path: { course_id: courseId } },
      body,
    }),
  );
}

export function updateReview(reviewId: number, body: ReviewUpdate) {
  return unwrap(
    api.PATCH("/api/v1/reviews/{review_id}", { params: { path: { review_id: reviewId } }, body }),
  );
}

export function deleteReview(reviewId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/reviews/{review_id}", { params: { path: { review_id: reviewId } } }),
  );
}
