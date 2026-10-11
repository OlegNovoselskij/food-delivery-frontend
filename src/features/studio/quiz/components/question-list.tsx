import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CircleHelp, Plus } from "lucide-react";
import { useState } from "react";

import type { QuizManage } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { moveId } from "@/features/studio/builder/program-model";

import { useAddQuestion, useReorderQuestions } from "../hooks";
import { emptyQuestion } from "../question-schema";
import { QuestionCard } from "./question-card";
import { QuestionForm } from "./question-form";

const POINTER_DISTANCE_PX = 6;

interface QuestionListProps {
  courseId: number;
  quiz: QuizManage;
}

export function QuestionList({ courseId, quiz }: QuestionListProps) {
  const [adding, setAdding] = useState(false);
  const add = useAddQuestion(courseId, quiz.id);
  const reorder = useReorderQuestions(courseId, quiz.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = quiz.questions.map((question) => question.id);
  const isEmpty = quiz.questions.length === 0;

  function handleDragEnd({ active, over }: DragEndEvent): void {
    if (over === null || active.id === over.id) return;
    reorder.mutate(moveId(ids, Number(active.id), Number(over.id)));
  }

  function openForm(): void {
    setAdding(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {isEmpty && !adding ? (
        <EmptyState
          icon={CircleHelp}
          title="No questions yet"
          description="Add the first question. Students can take the quiz once it has at least one."
          action={
            <Button onClick={openForm}>
              <Plus aria-hidden="true" />
              Add question
            </Button>
          }
        />
      ) : null}
      {isEmpty ? null : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul aria-label="Questions" className="flex flex-col gap-4">
              {quiz.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  courseId={courseId}
                  quizId={quiz.id}
                  question={question}
                  number={index + 1}
                  gradingLocked={quiz.has_attempts}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {adding ? (
        <section
          aria-label="New question"
          className="rounded-card border border-line bg-surface p-4"
        >
          <h3 className="mb-4 text-h3 font-semibold">New question</h3>
          <QuestionForm
            initialValues={emptyQuestion()}
            submitLabel="Add question"
            pendingLabel="Adding"
            pending={add.isPending}
            gradingLocked={false}
            onSubmit={(payload, onServerError) => {
              add.mutate(payload, {
                onSuccess: () => {
                  setAdding(false);
                },
                onError: onServerError,
              });
            }}
            onCancel={() => {
              setAdding(false);
            }}
          />
        </section>
      ) : null}
      {!adding && !isEmpty ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface p-4">
          <Button variant="link" onClick={openForm}>
            <Plus aria-hidden="true" />
            Add question
          </Button>
        </div>
      ) : null}
    </div>
  );
}
