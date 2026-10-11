import { CircleHelp, FileText, Lock, Play } from "lucide-react";
import { Link } from "react-router";

import type { LessonSummary, Program, ProgramModule } from "@/api/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/dates";
import { lessonPath } from "@/lib/paths";

interface ProgramAccordionProps {
  courseId: number;
  program: Program;
  fullAccess: boolean;
}

function itemsLabel(module: ProgramModule): string {
  const count = module.lessons.length + (module.has_quiz ? 1 : 0);
  return count === 1 ? "1 item" : `${count} items`;
}

interface LessonRowProps {
  courseId: number;
  lesson: LessonSummary;
  fullAccess: boolean;
}

function LessonRow({ courseId, lesson, fullAccess }: LessonRowProps) {
  const openable = fullAccess || lesson.is_preview;
  const Icon = lesson.lesson_type === "article" ? FileText : Play;
  const title = (
    <>
      <Icon
        aria-hidden="true"
        className={openable ? "size-4 shrink-0 text-brand-600" : "size-4 shrink-0 text-faint"}
      />
      <span className="min-w-0 flex-1">{lesson.title}</span>
    </>
  );

  return (
    <li className="flex items-center gap-3 border-t border-line px-5 py-3.5 first:border-t-0 sm:pl-16">
      {openable ? (
        <Link
          to={lessonPath(courseId, lesson.id)}
          className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
        >
          {title}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 text-ink-soft">{title}</div>
      )}
      {lesson.is_preview ? <Badge tone="neutral">Preview</Badge> : null}
      {!openable ? (
        <Lock aria-label="Locked until you enroll" className="size-3.5 text-faint" />
      ) : null}
      <span className="w-14 text-right text-small text-muted">
        {formatDuration(lesson.duration_minutes)}
      </span>
    </li>
  );
}

export function ProgramAccordion({ courseId, program, fullAccess }: ProgramAccordionProps) {
  const openModules = program.modules.map((module) => String(module.id));

  return (
    <Accordion type="multiple" defaultValue={openModules} className="flex flex-col gap-4">
      {program.modules.map((module, index) => (
        <AccordionItem key={module.id} value={String(module.id)}>
          <AccordionTrigger>
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 font-semibold text-brand-700"
            >
              {index + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-h3 font-semibold">{module.title}</span>
              <span className="text-small text-muted">{itemsLabel(module)}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul>
              {module.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  courseId={courseId}
                  lesson={lesson}
                  fullAccess={fullAccess}
                />
              ))}
              {module.has_quiz ? (
                <li className="flex items-center gap-3 border-t border-line px-5 py-3.5 text-ink-soft sm:pl-16">
                  <CircleHelp aria-hidden="true" className="size-4 shrink-0 text-faint" />
                  <span className="flex-1">Module quiz</span>
                </li>
              ) : null}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
