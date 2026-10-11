import { Award, ClipboardCheck, Clock, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

import type { Course, Program } from "@/api/types";
import { PriceTag } from "@/components/domain/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnrollMutation } from "@/features/enrollment";
import { isFree } from "@/lib/money";
import { signInPathFor } from "@/lib/safe-redirect";

import type { CourseAccess } from "../access";
import { firstPreviewLesson, formatTotalDuration, lessonPath, quizCount } from "../program";

interface EnrollCardProps {
  course: Course;
  program: Program | undefined;
  access: CourseAccess;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function includedItems(program: Program | undefined): { icon: LucideIcon; text: string }[] {
  const items: { icon: LucideIcon; text: string }[] = [];
  if (program) {
    items.push({
      icon: Video,
      text: `${countLabel(program.modules.length, "module", "modules")}, ${countLabel(program.total_lessons, "lesson", "lessons")}`,
    });
    const quizzes = quizCount(program);
    if (quizzes > 0) {
      items.push({
        icon: ClipboardCheck,
        text: `${countLabel(quizzes, "quiz", "quizzes")} with instant feedback`,
      });
    }
    const duration = formatTotalDuration(program.total_duration_minutes);
    if (duration !== "") items.push({ icon: Clock, text: `${duration} of content` });
  }
  items.push({ icon: Award, text: "Verifiable certificate on completion" });
  return items;
}

function PrimaryAction({ course, access }: { course: Course; access: CourseAccess }) {
  const enroll = useEnrollMutation(course.id);
  const free = isFree(course.price);

  switch (access.kind) {
    case "visitor":
      return (
        <Button asChild size="lg" className="w-full">
          <Link to={signInPathFor(`/courses/${course.id}`)}>Enroll in course</Link>
        </Button>
      );
    case "owner":
      return (
        <Button asChild size="lg" className="w-full">
          <Link to={`/studio/courses/${course.id}`}>Edit in studio</Link>
        </Button>
      );
    case "learning":
      return (
        <Button asChild size="lg" className="w-full">
          <Link to={`/learning/courses/${course.id}`}>Continue learning</Link>
        </Button>
      );
    case "awaiting-payment":
      return <Badge tone="warning">Payment pending</Badge>;
    case "available":
      return (
        <Button
          size="lg"
          className="w-full"
          disabled={enroll.isPending}
          onClick={() => {
            enroll.mutate();
          }}
        >
          {enroll.isPending ? "Enrolling" : free ? "Enroll for free" : "Enroll in course"}
        </Button>
      );
  }
}

export function EnrollCard({ course, program, access }: EnrollCardProps) {
  const preview = program ? firstPreviewLesson(program) : null;
  const showPreview = preview !== null && access.kind !== "learning" && access.kind !== "owner";

  return (
    <aside
      aria-label="Enrollment"
      className="rounded-panel border border-line bg-surface p-6 lg:sticky lg:top-24"
    >
      <PriceTag amount={course.price} className="text-[2.5rem] leading-none" />
      <p className="mt-3 text-muted">
        {isFree(course.price) ? "Free, lifetime access" : "One-time payment, lifetime access"}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <PrimaryAction course={course} access={access} />
        {showPreview ? (
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link to={lessonPath(course.id, preview.id)}>Preview first lessons</Link>
          </Button>
        ) : null}
      </div>
      <ul className="mt-6 flex flex-col gap-3.5 border-t border-line pt-6">
        {includedItems(program).map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-ink-soft">
            <Icon aria-hidden="true" className="size-[18px] shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
