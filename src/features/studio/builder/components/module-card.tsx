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
import { ChevronDown, CircleHelp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ProgramModule } from "@/api/types";
import { InlineTitleForm } from "@/components/domain/inline-title-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useCreateQuiz } from "../../quiz/hooks";
import { defaultQuizValues, toQuizPayload } from "../../quiz/quiz-schema";
import { useAddLesson, useDeleteModule, useRenameModule, useReorderLessons } from "../hooks";
import { moveId } from "../program-model";
import { AddLessonForm } from "./add-lesson-form";
import { LessonRow, QuizRow } from "./lesson-row";
import { SortableItem } from "./sortable-item";

const POINTER_DISTANCE_PX = 6;

interface ModuleCardProps {
  courseId: number;
  module: ProgramModule;
  number: number;
  selectedLessonId: number | null;
}

function itemsLabel(module: ProgramModule): string {
  const count = module.lessons.length + (module.has_quiz ? 1 : 0);
  return count === 1 ? "1 item" : `${count} items`;
}

export function ModuleCard({ courseId, module, number, selectedLessonId }: ModuleCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const rename = useRenameModule(courseId);
  const remove = useDeleteModule(courseId);
  const addLesson = useAddLesson(courseId);
  const reorder = useReorderLessons(courseId);
  const createQuiz = useCreateQuiz(courseId, module.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const lessonIds = module.lessons.map((lesson) => lesson.id);

  function handleDragEnd({ active, over }: DragEndEvent): void {
    if (over === null || active.id === over.id) return;
    const next = moveId(lessonIds, Number(active.id), Number(over.id));
    reorder.mutate({ moduleId: module.id, ids: next });
  }

  return (
    <SortableItem
      id={module.id}
      handleLabel={`Reorder module ${module.title}`}
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      {(handle) => (
        <>
          <div className="flex flex-wrap items-center gap-2 bg-sunken px-3 py-3">
            {handle}
            {renaming ? (
              <div className="min-w-0 flex-1">
                <InlineTitleForm
                  label="Module title"
                  initialValue={module.title}
                  submitLabel="Save"
                  pending={rename.isPending}
                  onSubmit={(title) => {
                    rename.mutate({ moduleId: module.id, title });
                    setRenaming(false);
                  }}
                  onCancel={() => {
                    setRenaming(false);
                  }}
                />
              </div>
            ) : (
              <>
                <h3 className="min-w-0 flex-1 truncate text-h3 font-semibold">
                  {number}. {module.title}
                </h3>
                <span className="text-small text-muted">{itemsLabel(module)}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRenaming(true);
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Rename
                  <span className="sr-only"> {module.title}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Delete module ${module.title}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    void remove.remove(module);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={collapsed ? `Expand ${module.title}` : `Collapse ${module.title}`}
                  aria-expanded={!collapsed}
                  onClick={() => {
                    setCollapsed((current) => !current);
                  }}
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("transition-transform", collapsed && "-rotate-90")}
                  />
                </Button>
              </>
            )}
          </div>
          {collapsed ? null : (
            <div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                  <ul aria-label={`Lessons in ${module.title}`}>
                    {module.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        courseId={courseId}
                        lesson={lesson}
                        selected={lesson.id === selectedLessonId}
                      />
                    ))}
                    {module.quiz_id !== null ? (
                      <QuizRow
                        courseId={courseId}
                        quizId={module.quiz_id}
                        questions={module.quiz_questions_count}
                      />
                    ) : null}
                  </ul>
                </SortableContext>
              </DndContext>
              <div className="border-t border-dashed border-line-strong px-3 py-2">
                {addingLesson ? (
                  <AddLessonForm
                    pending={addLesson.isPending}
                    onSubmit={(body) => {
                      addLesson.mutate(
                        { moduleId: module.id, body },
                        {
                          onSuccess: () => {
                            setAddingLesson(false);
                          },
                        },
                      );
                    }}
                    onCancel={() => {
                      setAddingLesson(false);
                    }}
                  />
                ) : (
                  <Button
                    variant="link"
                    className="py-2"
                    onClick={() => {
                      setAddingLesson(true);
                    }}
                  >
                    <Plus aria-hidden="true" />
                    Add lesson
                    <span className="sr-only"> to {module.title}</span>
                  </Button>
                )}
                {module.quiz_id === null && !addingLesson ? (
                  <Button
                    variant="link"
                    className="ml-5 py-2"
                    disabled={createQuiz.isPending}
                    onClick={() => {
                      createQuiz.mutate(toQuizPayload(defaultQuizValues()));
                    }}
                  >
                    <CircleHelp aria-hidden="true" />
                    {createQuiz.isPending ? "Adding quiz" : "Add quiz"}
                    <span className="sr-only"> to {module.title}</span>
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </SortableItem>
  );
}
