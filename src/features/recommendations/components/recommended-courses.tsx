import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { CourseCard } from "@/components/domain/course-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/cn";

import { RECOMMENDATIONS_LIMIT, recommendationsQuery } from "../api";

const GRID_CLASS = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

interface RecommendedCoursesProps {
  className?: string;
}

function RecommendationsBody({ className }: RecommendedCoursesProps) {
  const recommendations = useQuery(recommendationsQuery(RECOMMENDATIONS_LIMIT));

  if (recommendations.isPending) {
    return (
      <section aria-label="Recommended for you" className={className}>
        <div role="status" aria-label="Loading recommendations" className={GRID_CLASS}>
          {Array.from({ length: RECOMMENDATIONS_LIMIT }, (_, index) => (
            <Skeleton key={index} className="h-72 rounded-card" />
          ))}
        </div>
      </section>
    );
  }
  if (recommendations.isError) {
    return (
      <section aria-label="Recommended for you" className={className}>
        <p className="flex flex-wrap items-center gap-3 rounded-control bg-sunken px-4 py-3 text-ink-soft">
          Recommendations are not available right now.
          <Button
            variant="link"
            onClick={() => {
              void recommendations.refetch();
            }}
          >
            Try again
          </Button>
        </p>
      </section>
    );
  }
  if (recommendations.data.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading" className={className}>
      <h2 id="recommended-heading" className="mb-4 flex items-center gap-2 text-h2">
        <Sparkles aria-hidden="true" className="size-5 text-brand-600" />
        Recommended for you
      </h2>
      <ul className={GRID_CLASS}>
        {recommendations.data.map((item) => (
          <li key={item.course.id} className="flex flex-col gap-2">
            <p className="text-small font-semibold text-brand-700">{item.reason}</p>
            <CourseCard course={item.course} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecommendedCourses({ className }: RecommendedCoursesProps) {
  const { session } = useAuth();
  if (session.status !== "authenticated") return null;
  return <RecommendationsBody className={cn(className)} />;
}
