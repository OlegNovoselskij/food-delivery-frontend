import { useQuery } from "@tanstack/react-query";
import { BookPlus, Plus } from "lucide-react";
import { Link } from "react-router";

import type { Course } from "@/api/types";
import { CourseCover } from "@/components/domain/course-cover";
import { KpiGrid, StatCard } from "@/components/domain/stat-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatPrice } from "@/lib/money";

import { myCoursesQuery, teacherDashboardQuery } from "../api";
import { CourseStatusBadge } from "../components/course-status-badge";
import { computeKpis, joinCourseStats, type StudioCourseRow } from "../dashboard";

function CourseRow({ row }: { row: StudioCourseRow }) {
  const { course, stats } = row;
  return (
    <li>
      <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 md:flex-row md:items-center">
        <CourseCover
          courseId={course.id}
          title={course.title}
          coverUrl={course.cover_url}
          className="h-24 rounded-control md:w-36 md:shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h3 font-semibold">
              <Link to={`/studio/courses/${course.id}`} className="hover:underline">
                {course.title}
              </Link>
            </h3>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mt-1 text-small text-muted">
            {course.category.name} · {formatPrice(course.price)} · {course.modules_count}{" "}
            {course.modules_count === 1 ? "module" : "modules"}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-small">
            <div>
              <dt className="text-muted">Students</dt>
              <dd className="font-semibold">{stats?.students ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Completed</dt>
              <dd className="font-semibold">{stats?.completed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Revenue</dt>
              <dd className="font-semibold">{formatMoney(stats?.revenue ?? "0")}</dd>
            </div>
            <div>
              <dt className="text-muted">Rating</dt>
              <dd className="font-semibold">
                {stats?.rating_avg == null ? "No reviews" : stats.rating_avg.toFixed(1)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={`/studio/courses/${course.id}`}>Edit course</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to={`/studio/courses/${course.id}/analytics`}>Analytics</Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

function sortedCourses(courses: readonly Course[]): Course[] {
  return [...courses].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your courses" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
      <Skeleton className="h-32 rounded-card" />
      <Skeleton className="h-32 rounded-card" />
    </div>
  );
}

export function Component() {
  const courses = useQuery(myCoursesQuery());
  const dashboard = useQuery(teacherDashboardQuery());

  const rows = joinCourseStats(sortedCourses(courses.data ?? []), dashboard.data);
  const kpis = computeKpis(rows, dashboard.data);

  return (
    <div className="container-page py-10">
      <title>Teaching · Atrium</title>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Teaching</h1>
        <Button asChild>
          <Link to="/studio/courses/new">
            <Plus aria-hidden="true" />
            New course
          </Link>
        </Button>
      </div>

      <div className="mt-8" aria-live="polite">
        {courses.isPending ? <DashboardSkeleton /> : null}
        {courses.isError ? (
          <ErrorState
            error={courses.error}
            title="Could not load your courses"
            onRetry={() => {
              void courses.refetch();
              void dashboard.refetch();
            }}
          />
        ) : null}
        {courses.data?.length === 0 ? (
          <EmptyState
            icon={BookPlus}
            title="You have not created a course yet"
            description="Create your first course, add lessons and quizzes, then publish it to the catalog."
            action={
              <Button asChild>
                <Link to="/studio/courses/new">Create a course</Link>
              </Button>
            }
          />
        ) : null}
        {courses.data && courses.data.length > 0 ? (
          <>
            <KpiGrid>
              <StatCard label="Courses" value={`${kpis.published} of ${kpis.courses} published`} />
              <StatCard label="Students" value={String(kpis.students)} />
              <StatCard label="Revenue" value={formatMoney(kpis.revenue)} />
              <StatCard
                label="Average rating"
                value={kpis.rating === null ? "No reviews" : kpis.rating.toFixed(1)}
              />
            </KpiGrid>
            <h2 className="mt-10 mb-4 text-h2">Your courses</h2>
            <ul className="flex flex-col gap-4">
              {rows.map((row) => (
                <CourseRow key={row.course.id} row={row} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
