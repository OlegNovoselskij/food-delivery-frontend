import type { Course } from "@/api/types";
import { initials } from "@/lib/format";

export function TeacherPanel({ course }: { course: Course }) {
  const { teacher } = course;
  return (
    <section className="flex gap-5 rounded-card border border-line bg-surface p-6">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-h3 font-semibold text-brand-700"
      >
        {initials(teacher.name, teacher.surname)}
      </span>
      <div>
        <h2 className="text-h2">
          {teacher.name} {teacher.surname}
        </h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          {teacher.bio ?? "This teacher has not added a bio yet."}
        </p>
      </div>
    </section>
  );
}
