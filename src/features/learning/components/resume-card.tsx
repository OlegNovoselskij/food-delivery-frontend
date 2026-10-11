import { Link } from "react-router";

import { CourseCover } from "@/components/domain/course-cover";
import { ProgressTrack } from "@/components/domain/progress-track";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lessonPath } from "@/lib/paths";

import type { ResumeTarget } from "../dashboard";
import { moduleFractions } from "../progress-model";

export function ResumeCard({ target }: { target: ResumeTarget }) {
  const { course } = target.item.enrollment;

  return (
    <section
      aria-label="Resume learning"
      className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface md:flex-row"
    >
      <CourseCover
        courseId={course.id}
        title={course.title}
        coverUrl={course.cover_url}
        className="h-40 md:h-auto md:w-[260px] md:shrink-0 lg:w-[360px]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
        <Badge tone="amber" className="self-start">
          Pick up where you left off
        </Badge>
        <h2 className="text-h2">{target.lessonTitle}</h2>
        <p className="text-muted">
          {course.title} · Module {target.moduleNumber} of {target.moduleCount}
        </p>
        <ProgressTrack
          segments={moduleFractions(target.progress)}
          label={`Progress in ${course.title}`}
        />
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to={lessonPath(course.id, target.lessonId)}>Continue lesson</Link>
          </Button>
          {target.minutesLeft > 0 ? (
            <span className="text-muted">{target.minutesLeft} min left</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
