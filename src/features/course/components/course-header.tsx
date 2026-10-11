import { Link } from "react-router";

import type { Course } from "@/api/types";
import { StarRow, formatRating } from "@/components/domain/rating";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";

function reviewsLabel(count: number): string {
  return count === 1 ? "1 review" : `${count} reviews`;
}

export function CourseHeader({ course }: { course: Course }) {
  const { teacher } = course;

  return (
    <header>
      <nav aria-label="Breadcrumb" className="text-small text-muted">
        <Link to="/courses" className="hover:underline">
          Courses
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{course.category.name}</span>
      </nav>
      <h1 className="mt-3 max-w-3xl text-display font-bold">{course.title}</h1>
      {course.description ? (
        <p className="mt-4 max-w-2xl text-h3 font-normal text-ink-soft">{course.description}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-small font-semibold text-brand-700"
          >
            {initials(teacher.name, teacher.surname)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {teacher.name} {teacher.surname}
            </p>
            {teacher.bio ? (
              <p className="max-w-56 truncate text-small text-muted">{teacher.bio}</p>
            ) : null}
          </div>
        </div>
        {course.rating_avg !== null ? (
          <div className="flex items-center gap-2">
            <StarRow value={course.rating_avg} />
            <span className="font-semibold">{formatRating(course.rating_avg)}</span>
            <span className="text-muted">{reviewsLabel(course.reviews_count)}</span>
          </div>
        ) : (
          <span className="text-muted">No reviews yet</span>
        )}
        <Badge>{course.category.name}</Badge>
      </div>
    </header>
  );
}
