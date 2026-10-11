import { BadgeCheck, BookOpenCheck, Route } from "lucide-react";

import { ProgressTrack } from "@/components/domain/progress-track";

const STEPS = [
  {
    icon: BookOpenCheck,
    title: "Pick a course",
    text: "Browse programs from working teachers and preview the first lessons before you enroll.",
  },
  {
    icon: Route,
    title: "Follow the path",
    text: "Every course is a sequence of modules. Your progress is always visible, module by module.",
  },
  {
    icon: BadgeCheck,
    title: "Earn a certificate",
    text: "Finish the program and get a certificate with a number anyone can verify online.",
  },
] as const;

const SAMPLE_PATH = [1, 1, 0.45, 0, 0] as const;

export function Component() {
  return (
    <>
      <title>Atrium | Courses taught by people who do the work</title>
      <section className="container-page pt-14 pb-10 sm:pt-20">
        <h1 className="max-w-3xl text-display font-bold">
          Courses taught by people who do the work
        </h1>
        <p className="mt-4 max-w-xl text-h3 font-normal text-muted">
          Follow the program module by module, pass the quizzes, and earn a certificate you can
          verify online.
        </p>
        <div className="mt-10 max-w-xl rounded-panel border border-line bg-surface p-6">
          <p className="text-small text-muted">Your path through a course</p>
          <ProgressTrack
            segments={SAMPLE_PATH}
            label="Sample course progress: 2 of 5 modules complete"
            className="mt-4"
          />
          <p className="mt-3 text-small text-ink-soft">2 of 5 modules complete</p>
        </div>
      </section>
      <section className="container-page pb-6">
        <ul className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-card border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-4 text-h3">{title}</h2>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
