import { CircleHelp, FileText, Video } from "lucide-react";
import { Link } from "react-router";

import type { LessonSummary } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/dates";

import { lessonStatus } from "../program-model";
import { SortableItem } from "./sortable-item";

interface LessonRowProps {
  courseId: number;
  lesson: LessonSummary;
  selected: boolean;
}

const STATUS_BADGES = {
  "video-ready": { label: "Video ready", tone: "success" },
  "no-video": { label: "No video", tone: "warning" },
  article: { label: "Article", tone: "neutral" },
} as const;

export function LessonRow({ courseId, lesson, selected }: LessonRowProps) {
  const status = STATUS_BADGES[lessonStatus(lesson)];
  const Icon = lesson.lesson_type === "video" ? Video : FileText;

  return (
    <SortableItem
      id={lesson.id}
      handleLabel={`Reorder lesson ${lesson.title}`}
      className={cn("border-t border-line bg-surface first:border-t-0", selected && "bg-brand-50")}
      draggingClassName="bg-surface"
    >
      {(handle) => (
        <div
          className={cn(
            "flex items-center gap-2 border-l-[3px] border-transparent px-2 py-1.5 sm:gap-3 sm:px-3",
            selected && "border-brand-600",
          )}
        >
          {handle}
          <Icon aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
          <Link
            to={`/studio/courses/${courseId}/lessons/${lesson.id}`}
            aria-current={selected ? "true" : undefined}
            className="min-w-0 flex-1 truncate rounded-control py-1.5 font-medium hover:underline"
          >
            {lesson.title}
          </Link>
          {lesson.is_preview ? (
            <Badge tone="brand" className="hidden sm:inline-flex">
              Free preview
            </Badge>
          ) : null}
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="hidden w-14 text-right text-small text-muted sm:block">
            {formatDuration(lesson.duration_minutes) || "None"}
          </span>
        </div>
      )}
    </SortableItem>
  );
}

export function QuizRow({ questions }: { questions: number }) {
  return (
    <li className="flex items-center gap-3 border-t border-line bg-surface px-4 py-2.5 sm:pl-[3.25rem]">
      <CircleHelp aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      <span className="flex-1 font-medium">Module quiz</span>
      <Badge tone="brand">
        Quiz · {questions} {questions === 1 ? "question" : "questions"}
      </Badge>
    </li>
  );
}
