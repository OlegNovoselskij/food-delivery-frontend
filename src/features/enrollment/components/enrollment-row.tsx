import type { ReactNode } from "react";
import { Link } from "react-router";

import type { Enrollment } from "@/api/types";
import { CourseCover } from "@/components/domain/course-cover";

import { EnrollmentActions } from "./enrollment-actions";
import { EnrollmentStatusBadge } from "./enrollment-status-badge";

interface EnrollmentRowProps {
  enrollment: Enrollment;
  progress?: ReactNode;
  certificateNumber?: string | undefined;
}

export function EnrollmentRow({ enrollment, progress, certificateNumber }: EnrollmentRowProps) {
  const { course } = enrollment;

  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <Link to={`/courses/${course.id}`} tabIndex={-1} aria-hidden="true" className="sm:shrink-0">
        <CourseCover
          courseId={course.id}
          title={course.title}
          coverUrl={course.cover_url}
          className="h-24 rounded-control sm:w-36"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className="text-h3 font-semibold">
          <Link to={`/courses/${course.id}`} className="hover:underline">
            {course.title}
          </Link>
        </h3>
        <p className="text-small text-muted">
          {course.teacher.name} {course.teacher.surname}
        </p>
        <div className="mt-2.5">
          {progress ?? <EnrollmentStatusBadge status={enrollment.status} />}
        </div>
      </div>
      <EnrollmentActions enrollment={enrollment} certificateNumber={certificateNumber} />
    </article>
  );
}
