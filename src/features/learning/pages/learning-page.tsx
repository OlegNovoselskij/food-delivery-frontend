import { useQueries, useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import type { HistoryItem } from "@/api/types";
import { ProgressTrack } from "@/components/domain/progress-track";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/features/auth";
import { myCertificatesQuery } from "@/features/certificates";
import { EnrollmentRow } from "@/features/enrollment";

import { historyQuery, progressQuery } from "../api";
import { ActivityPanel, CertificatesPanel, StatsPanel } from "../components/dashboard-aside";
import { ResumeCard } from "../components/resume-card";
import {
  computeStats,
  groupHistory,
  moduleProgressLabel,
  recentActivity,
  resumeTarget,
} from "../dashboard";
import { moduleFractions } from "../progress-model";

const RECENT_ITEMS = 3;
const PERCENT = 100;

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your learning"
      className="grid gap-8 lg:grid-cols-[1fr_340px]"
    >
      <div className="flex flex-col gap-6">
        <Skeleton className="h-64 rounded-panel" />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-h2">{title}</h2>
      <ul className="flex flex-col gap-4">{children}</ul>
    </section>
  );
}

function DashboardContent({ items }: { items: readonly HistoryItem[] }) {
  const groups = groupHistory(items);
  const certificates = useQuery(myCertificatesQuery());
  const progresses = useQueries({
    queries: groups.active.map((item) => progressQuery(item.enrollment.id)),
  });
  const progressFor = (index: number) => progresses[index]?.data;
  const resume = groups.active
    .map((item, index) => resumeTarget(item, progressFor(index)))
    .find((target) => target !== null);

  const certificateNumbers = new Map(
    (certificates.data ?? []).map((certificate) => [
      certificate.course_id,
      certificate.certificate_number,
    ]),
  );

  if (items.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {resume ? <ResumeCard target={resume} /> : null}

        {groups.active.length > 0 ? (
          <Section title="In progress">
            {groups.active.map((item, index) => {
              const progress = progressFor(index);
              return (
                <li key={item.enrollment.id}>
                  <EnrollmentRow
                    enrollment={item.enrollment}
                    progress={
                      progress ? (
                        <div className="flex flex-col gap-1.5">
                          <ProgressTrack
                            segments={moduleFractions(progress)}
                            label={`Progress in ${item.enrollment.course.title}`}
                          />
                          <span className="text-small text-muted">
                            {moduleProgressLabel(progress)}
                          </span>
                        </div>
                      ) : (
                        <ProgressTrack
                          segments={[item.progress.percent / PERCENT]}
                          label={`Progress in ${item.enrollment.course.title}`}
                        />
                      )
                    }
                  />
                </li>
              );
            })}
          </Section>
        ) : null}

        {groups.pending.length > 0 ? (
          <Section title="Awaiting payment">
            {groups.pending.map((item) => (
              <li key={item.enrollment.id}>
                <EnrollmentRow enrollment={item.enrollment} />
              </li>
            ))}
          </Section>
        ) : null}

        {groups.completed.length > 0 ? (
          <Section title="Completed">
            {groups.completed.map((item) => (
              <li key={item.enrollment.id}>
                <EnrollmentRow
                  enrollment={item.enrollment}
                  certificateNumber={certificateNumbers.get(item.enrollment.course.id)}
                />
              </li>
            ))}
          </Section>
        ) : null}

        {groups.cancelled.length > 0 ? (
          <Section title="Cancelled">
            {groups.cancelled.map((item) => (
              <li key={item.enrollment.id}>
                <EnrollmentRow enrollment={item.enrollment} />
              </li>
            ))}
          </Section>
        ) : null}
      </div>

      <aside aria-label="Summary" className="flex flex-col gap-4">
        <StatsPanel stats={computeStats(items)} />
        <CertificatesPanel certificates={certificates.data ?? []} />
        <ActivityPanel items={recentActivity(items, RECENT_ITEMS)} />
      </aside>
    </div>
  );
}

export function Component() {
  const user = useUser();
  const history = useQuery(historyQuery());

  return (
    <div className="container-page py-10">
      <title>My learning · Atrium</title>
      <h1 className="mb-8 text-h1">Welcome back, {user.name}</h1>
      {history.isPending ? <DashboardSkeleton /> : null}
      {history.isError ? (
        <ErrorState
          error={history.error}
          title="Could not load your learning"
          onRetry={() => {
            void history.refetch();
          }}
        />
      ) : null}
      {history.data ? <DashboardContent items={history.data} /> : null}
    </div>
  );
}
