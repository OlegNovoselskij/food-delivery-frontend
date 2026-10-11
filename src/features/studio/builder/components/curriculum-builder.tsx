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
import { LayoutList, Plus } from "lucide-react";
import { useState } from "react";

import type { Program } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

import { useAddModule, useReorderModules } from "../hooks";
import { moveId } from "../program-model";
import { InlineTitleForm } from "./inline-title-form";
import { ModuleCard } from "./module-card";

const POINTER_DISTANCE_PX = 6;

interface CurriculumBuilderProps {
  courseId: number;
  program: Program;
  selectedLessonId: number | null;
}

export function CurriculumBuilder({ courseId, program, selectedLessonId }: CurriculumBuilderProps) {
  const [addingModule, setAddingModule] = useState(false);
  const addModule = useAddModule(courseId);
  const reorder = useReorderModules(courseId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_DISTANCE_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const moduleIds = program.modules.map((module) => module.id);

  function handleDragEnd({ active, over }: DragEndEvent): void {
    if (over === null || active.id === over.id) return;
    reorder.mutate(moveId(moduleIds, Number(active.id), Number(over.id)));
  }

  return (
    <div className="flex flex-col gap-5">
      {program.modules.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title="No modules yet"
          description="A course is a path of modules. Add the first module, then fill it with lessons."
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
            <ul aria-label="Modules" className="flex flex-col gap-5">
              {program.modules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  courseId={courseId}
                  module={module}
                  number={index + 1}
                  selectedLessonId={selectedLessonId}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="rounded-card border border-dashed border-line-strong bg-surface p-4">
        {addingModule ? (
          <InlineTitleForm
            label="Module title"
            submitLabel="Add module"
            pending={addModule.isPending}
            onSubmit={(title) => {
              addModule.mutate(title, {
                onSuccess: () => {
                  setAddingModule(false);
                },
              });
            }}
            onCancel={() => {
              setAddingModule(false);
            }}
          />
        ) : (
          <Button
            variant="link"
            onClick={() => {
              setAddingModule(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add module
          </Button>
        )}
      </div>
    </div>
  );
}
