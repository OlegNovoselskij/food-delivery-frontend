import { Award, Check } from "lucide-react";
import { Link } from "react-router";

import type { Certificate, HistoryItem } from "@/api/types";
import { formatRelative } from "@/lib/dates";

import type { DashboardStats } from "../dashboard";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1.5 text-[2rem] leading-none font-bold tracking-tight">{value}</p>
    </div>
  );
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function StatsPanel({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      <StatCard label="Lessons completed" value={String(stats.lessonsCompleted)} />
      <StatCard label="Courses completed" value={String(stats.coursesCompleted)} />
      <StatCard label="Time learned" value={formatHours(stats.minutesLearned)} />
    </div>
  );
}

export function CertificatesPanel({ certificates }: { certificates: readonly Certificate[] }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold">Certificates</h2>
        <span className="text-small text-muted">{certificates.length}</span>
      </div>
      {certificates.length === 0 ? (
        <p className="mt-3 text-muted">No certificates yet. Finish a course to earn one.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {certificates.slice(0, 3).map((certificate) => (
            <li key={certificate.id}>
              <Link
                to={`/certificates/verify/${certificate.certificate_number}`}
                className="flex items-center gap-3 rounded-control hover:bg-sunken/60"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-amber-50 text-warning-ink">
                  <Award aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{certificate.course_title}</span>
                  <span className="block text-small text-muted">
                    {certificate.certificate_number}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ActivityPanel({ items }: { items: readonly HistoryItem[] }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-h3 font-semibold">Recently</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-muted">Your activity appears here after you start a lesson.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => (
            <li key={item.enrollment.id} className="flex items-start gap-3 py-3">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-soft" />
              <span className="min-w-0 flex-1 text-ink-soft">
                Studied {item.enrollment.course.title}
              </span>
              {item.last_activity_at ? (
                <time dateTime={item.last_activity_at} className="shrink-0 text-small text-muted">
                  {formatRelative(item.last_activity_at)}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
