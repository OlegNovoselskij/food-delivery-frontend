import { Award, ClipboardCheck, Clock, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { Course, Enrollment, Program } from "@/api/types";
import { PriceTag } from "@/components/domain/price-tag";
import { Button } from "@/components/ui/button";
import {
  ENROLLMENT_STATUS,
  PaymentDialog,
  useCancelEnrollment,
  useEnrollMutation,
} from "@/features/enrollment";
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

function AwaitingPaymentActions({
  enrollment,
  onPay,
}: {
  enrollment: Enrollment;
  onPay: () => void;
}) {
  const { cancel, isPending } = useCancelEnrollment();

  return (
    <>
      <Button size="lg" className="w-full" onClick={onPay}>
        Pay now
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          void cancel(enrollment);
        }}
      >
        Cancel enrollment
      </Button>
    </>
  );
}

function AvailableActions({
  course,
  onPaymentRequired,
}: {
  course: Course;
  onPaymentRequired: () => void;
}) {
  const enroll = useEnrollMutation(course.id);

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={enroll.isPending}
      onClick={() => {
        enroll.mutate(undefined, {
          onSuccess: (enrollment) => {
            if (enrollment.status === ENROLLMENT_STATUS.pendingPayment) onPaymentRequired();
          },
        });
      }}
    >
      {enroll.isPending
        ? "Enrolling"
        : isFree(course.price)
          ? "Enroll for free"
          : "Enroll in course"}
    </Button>
  );
}

interface PrimaryActionsProps {
  course: Course;
  access: CourseAccess;
  onPay: () => void;
}

function PrimaryActions({ course, access, onPay }: PrimaryActionsProps) {
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
      return <AwaitingPaymentActions enrollment={access.enrollment} onPay={onPay} />;
    case "available":
      return <AvailableActions course={course} onPaymentRequired={onPay} />;
  }
}

export function EnrollCard({ course, program, access }: EnrollCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
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
        <PrimaryActions
          course={course}
          access={access}
          onPay={() => {
            setPaymentOpen(true);
          }}
        />
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
      {access.kind === "awaiting-payment" ? (
        <PaymentDialog
          enrollmentId={access.enrollment.id}
          course={access.enrollment.course}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
        />
      ) : null}
    </aside>
  );
}
