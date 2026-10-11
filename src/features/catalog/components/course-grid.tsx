import { SearchX } from "lucide-react";

import type { CourseListItem } from "@/api/types";
import { CourseCard } from "@/components/domain/course-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARDS = 6;
const PRIORITY_CARDS = 3;
const GRID_CLASS = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

export function CourseGridSkeleton() {
  return (
    <div role="status" aria-label="Loading courses" className={GRID_CLASS}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-card border border-line bg-surface">
          <Skeleton className="h-[148px] rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="mt-4 h-4 w-1/3" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="mt-2 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CourseGridProps {
  courses: readonly CourseListItem[];
  filtersActive: boolean;
  onClearFilters: () => void;
  onPrefetch: (courseId: number) => void;
}

export function CourseGrid({
  courses,
  filtersActive,
  onClearFilters,
  onPrefetch,
}: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={filtersActive ? "No courses match your filters" : "No courses yet"}
        description={
          filtersActive
            ? "Try a different search, another category, or remove some filters."
            : "Published courses will appear here. Check back soon."
        }
        action={
          filtersActive ? (
            <Button variant="secondary" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className={GRID_CLASS}>
      {courses.map((course, index) => (
        <li key={course.id} className="flex">
          <CourseCard course={course} onPrefetch={onPrefetch} priority={index < PRIORITY_CARDS} />
        </li>
      ))}
    </ul>
  );
}
