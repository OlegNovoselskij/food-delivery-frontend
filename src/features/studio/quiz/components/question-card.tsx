import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { QuestionManage } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableItem } from "@/features/studio/builder/components/sortable-item";

import { useDeleteQuestion, useUpdateQuestion } from "../hooks";
import { questionToValues, questionTypeLabel } from "../question-schema";
import { QuestionForm } from "./question-form";

interface QuestionCardProps {
  courseId: number;
  quizId: number;
  question: QuestionManage;
  number: number;
  gradingLocked: boolean;
}

export function QuestionCard({
  courseId,
  quizId,
  question,
  number,
  gradingLocked,
}: QuestionCardProps) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateQuestion(courseId, quizId, question.id);
  const deletion = useDeleteQuestion(courseId, quizId);

  return (
    <SortableItem
      id={question.id}
      handleLabel={`Reorder question ${number}`}
      className="rounded-card border border-line bg-surface"
    >
      {(handle) => (
        <div className="p-4">
          <div className="flex items-start gap-2">
            {handle}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-small font-semibold text-muted">Question {number}</span>
                <Badge tone="neutral">{questionTypeLabel(question.question_type)}</Badge>
                <Badge tone="brand">
                  {question.points} {question.points === 1 ? "point" : "points"}
                </Badge>
              </div>
              {editing ? null : (
                <p className="mt-1.5 font-semibold whitespace-pre-wrap">{question.text}</p>
              )}
            </div>
            {editing ? null : (
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit question ${number}`}
                  onClick={() => {
                    setEditing(true);
                  }}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete question ${number}`}
                  disabled={gradingLocked || deletion.isPending}
                  onClick={() => {
                    void deletion.remove(question);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
          {editing ? (
            <div className="mt-4">
              <QuestionForm
                initialValues={questionToValues(question)}
                submitLabel="Save question"
                pendingLabel="Saving"
                pending={update.isPending}
                gradingLocked={gradingLocked}
                onSubmit={(payload, onServerError) => {
                  update.mutate(payload, {
                    onSuccess: () => {
                      setEditing(false);
                    },
                    onError: onServerError,
                  });
                }}
                onCancel={() => {
                  setEditing(false);
                }}
              />
            </div>
          ) : (
            <ul
              aria-label={`Options for question ${number}`}
              className="mt-3 flex flex-col gap-1.5 pl-10"
            >
              {question.options.map((option) => (
                <li key={option.id} className="flex items-start gap-2 text-ink-soft">
                  {option.is_correct ? (
                    <>
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-success-ink" />
                      <span className="sr-only">Correct: </span>
                      <span className="font-medium text-success-ink">{option.text}</span>
                    </>
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        className="mt-2 ml-1.5 size-1.5 shrink-0 rounded-full bg-line-strong"
                      />
                      <span>{option.text}</span>
                    </>
                  )}
                </li>
              ))}
              {question.question_type === "open_text" ? (
                <li className="text-small text-muted">Open answer, graded by you</li>
              ) : null}
            </ul>
          )}
        </div>
      )}
    </SortableItem>
  );
}
