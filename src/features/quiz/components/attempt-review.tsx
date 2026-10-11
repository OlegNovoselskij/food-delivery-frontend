import { CircleCheck, CircleX, Clock } from "lucide-react";

import type { AnswerReview } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { QUESTION_TYPES } from "../answers";

function verdict(item: AnswerReview) {
  if (item.needs_review) {
    return (
      <Badge tone="warning">
        <Clock aria-hidden="true" className="size-3" />
        Awaiting review
      </Badge>
    );
  }
  if (item.is_correct === true) {
    return (
      <Badge tone="success">
        <CircleCheck aria-hidden="true" className="size-3" />
        Correct
      </Badge>
    );
  }
  const partial = (item.points_awarded ?? 0) > 0;
  return (
    <Badge tone={partial ? "warning" : "danger"}>
      <CircleX aria-hidden="true" className="size-3" />
      {partial ? "Partly correct" : "Incorrect"}
    </Badge>
  );
}

function pointsText(item: AnswerReview): string {
  if (item.points_awarded === null)
    return `${item.points} ${item.points === 1 ? "point" : "points"}`;
  return `${item.points_awarded} of ${item.points} ${item.points === 1 ? "point" : "points"}`;
}

function OptionRow({
  item,
  optionId,
  text,
}: {
  item: AnswerReview;
  optionId: number;
  text: string;
}) {
  const selected = item.selected_option_ids.includes(optionId);
  const correct = item.correct_option_ids.includes(optionId);
  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-control border px-3 py-2.5",
        correct ? "border-success-600 bg-success-50" : "border-line",
        selected && !correct && "border-danger-600 bg-danger-50",
      )}
    >
      <span className="flex-1">{text}</span>
      {selected ? (
        <span className="text-small font-semibold text-ink-soft">Your answer</span>
      ) : null}
      {correct ? (
        <span className="text-small font-semibold text-success-ink">Correct answer</span>
      ) : null}
    </li>
  );
}

export function AttemptReview({ review }: { review: readonly AnswerReview[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {review.map((item, index) => (
        <li key={item.question_id} className="rounded-card border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-semibold text-muted">
              Question {index + 1} · {pointsText(item)}
            </p>
            {verdict(item)}
          </div>
          <h3 className="mt-1.5 text-h3 font-semibold">{item.question_text}</h3>
          {item.question_type === QUESTION_TYPES.text ? (
            <div className="mt-4">
              <p className="text-small font-semibold text-muted">Your answer</p>
              <p className="mt-1 whitespace-pre-wrap rounded-control bg-sunken px-3 py-2.5 text-ink-soft">
                {item.text_answer ?? "No answer given."}
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {item.options.map((option) => (
                <OptionRow key={option.id} item={item} optionId={option.id} text={option.text} />
              ))}
            </ul>
          )}
          {item.teacher_comment ? (
            <p className="mt-4 rounded-control bg-brand-50 px-3 py-2.5 text-brand-700">
              <span className="font-semibold">Teacher comment: </span>
              {item.teacher_comment}
            </p>
          ) : null}
          {item.explanation ? (
            <p className="mt-4 text-ink-soft">
              <span className="font-semibold">Explanation: </span>
              {item.explanation}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
