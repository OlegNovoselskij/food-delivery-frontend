import { Link } from "react-router";

import type { CourseListItem } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CourseCover } from "./course-cover";
import { PriceTag } from "./price-tag";
import { ProgressTrack } from "./progress-track";
import { RatingBadge } from "./rating";

interface CourseCardProps {
  course: CourseListItem;
  onPrefetch?: (courseId: number) => void;
}

function moduleCountLabel(count: number): string {
  return count === 1 ? "1 module" : `${count} modules`;
}

export function CourseCard({ course, onPrefetch }: CourseCardProps) {
  const href = `/courses/${course.id}`;
  const prefetch = () => {
    onPrefetch?.(course.id);
  };

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface">
      <Link to={href} tabIndex={-1} aria-hidden="true" onMouseEnter={prefetch}>
        <CourseCover
          courseId={course.id}
          title={course.title}
          coverUrl={course.cover_url}
          className="h-[148px]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge>{course.category.name}</Badge>
          <RatingBadge value={course.rating_avg} count={course.reviews_count} />
        </div>
        <h3 className="text-h3 font-semibold">
          <Link to={href} onMouseEnter={prefetch} onFocus={prefetch} className="hover:underline">
            {course.title}
          </Link>
        </h3>
        <p className="mt-auto pt-5 text-small text-muted">
          {course.teacher.name} {course.teacher.surname}
        </p>
        <div className="mt-1.5 flex flex-col gap-1">
          <ProgressTrack
            segments={Array.from({ length: course.modules_count }, () => 0)}
            label={`${moduleCountLabel(course.modules_count)} in this course`}
          />
          <span className="text-micro text-muted">{moduleCountLabel(course.modules_count)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <PriceTag amount={course.price} />
          <Button asChild variant="secondary" size="sm">
            <Link to={href} onMouseEnter={prefetch}>
              View course
              <span className="sr-only">: {course.title}</span>
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
