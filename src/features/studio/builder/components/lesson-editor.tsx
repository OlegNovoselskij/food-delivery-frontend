import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";

import type { Lesson } from "@/api/types";
import { ErrorState } from "@/components/feedback/error-state";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SwitchField } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea";
import { lessonQuery } from "@/features/learning";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes";
import { formSubmit } from "@/lib/form-submit";

import { useDeleteLesson, useUpdateLesson } from "../hooks";
import {
  LESSON_TYPE_OPTIONS,
  isLessonType,
  lessonSchema,
  toLessonPayload,
  type LessonFormValues,
} from "../lesson-schema";

const FIELDS = ["title", "content", "lesson_type", "duration", "is_preview"] as const;

function initialValues(lesson: Lesson): LessonFormValues {
  return {
    title: lesson.title,
    content: lesson.content ?? "",
    lesson_type: isLessonType(lesson.lesson_type) ? lesson.lesson_type : "video",
    duration: lesson.duration_minutes === null ? "" : String(lesson.duration_minutes),
    is_preview: lesson.is_preview,
  };
}

interface LessonFormProps {
  courseId: number;
  lesson: Lesson;
}

function LessonForm({ courseId, lesson }: LessonFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: initialValues(lesson),
  });
  const { control, register, handleSubmit, setError, reset, formState } = form;
  const { errors, isDirty } = formState;
  const update = useUpdateLesson(courseId, lesson.id);
  const deletion = useDeleteLesson(courseId);
  const { handleError } = useServerFormErrors<LessonFormValues>({ setError, fields: FIELDS });
  useUnsavedChangesGuard(isDirty);

  const submit = handleSubmit((values) => {
    update.mutate(toLessonPayload(values), {
      onSuccess: (saved) => {
        reset(initialValues(saved));
      },
      onError: handleError,
    });
  });

  return (
    <form onSubmit={formSubmit(submit)} noValidate className="flex flex-col gap-5">
      <TextField label="Title" error={errors.title?.message} {...register("title")} />
      <TextareaField
        label="Description"
        hint="Shown to students under the video, or as the lesson text for an article."
        error={errors.content?.message}
        {...register("content")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lesson-type">Lesson type</Label>
          <Controller
            control={control}
            name="lesson_type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (isLessonType(value)) field.onChange(value);
                }}
              >
                <SelectTrigger id="lesson-type" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <TextField
          label="Duration in minutes"
          inputMode="numeric"
          error={errors.duration?.message}
          {...register("duration")}
        />
      </div>
      <Controller
        control={control}
        name="is_preview"
        render={({ field }) => (
          <SwitchField
            id="lesson-preview"
            label="Free preview"
            description="Anyone can watch this lesson without enrolling."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <FormError message={errors.root?.server?.message} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? "Saving" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={deletion.isPending}
          onClick={() => {
            void deletion.remove({ id: lesson.id, title: lesson.title });
          }}
        >
          Delete lesson
        </Button>
      </div>
    </form>
  );
}

interface LessonEditorProps {
  courseId: number;
  lessonId: number;
}

export function LessonEditor({ courseId, lessonId }: LessonEditorProps) {
  const lesson = useQuery(lessonQuery(lessonId));

  if (lesson.isPending) {
    return (
      <div role="status" aria-label="Loading lesson" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }
  if (lesson.isError) {
    return (
      <ErrorState
        error={lesson.error}
        title="Could not load this lesson"
        onRetry={() => {
          void lesson.refetch();
        }}
      />
    );
  }

  return (
    <div>
      <p className="text-small text-muted">Editing lesson</p>
      <h2 className="mt-1 mb-5 text-h2">{lesson.data.title}</h2>
      <LessonForm key={lesson.data.id} courseId={courseId} lesson={lesson.data} />
    </div>
  );
}
