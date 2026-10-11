import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/features/auth";
import { EnrollmentRow, myEnrollmentsQuery } from "@/features/enrollment";

function EnrollmentsSkeleton() {
  return (
    <div role="status" aria-label="Loading your courses" className="flex flex-col gap-4">
      <Skeleton className="h-32 rounded-card" />
      <Skeleton className="h-32 rounded-card" />
    </div>
  );
}

export function Component() {
  const user = useUser();
  const enrollments = useQuery(myEnrollmentsQuery());

  return (
    <div className="container-page max-w-4xl py-10">
      <title>My learning · Atrium</title>
      <h1 className="text-h1">Welcome back, {user.name}</h1>
      <h2 className="mt-8 mb-4 text-h2">My courses</h2>
      {enrollments.isPending ? <EnrollmentsSkeleton /> : null}
      {enrollments.isError ? (
        <ErrorState
          error={enrollments.error}
          title="Could not load your courses"
          onRetry={() => {
            void enrollments.refetch();
          }}
        />
      ) : null}
      {enrollments.data?.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="You are not enrolled in any course yet"
          description="Browse the catalog, pick a course and start learning today."
          action={
            <Button asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : null}
      {enrollments.data && enrollments.data.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {enrollments.data.map((enrollment) => (
            <li key={enrollment.id}>
              <EnrollmentRow enrollment={enrollment} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
