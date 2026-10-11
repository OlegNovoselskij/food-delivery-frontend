import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";

import type { Course } from "@/api/types";
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
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea";
import { categoriesQuery } from "@/features/catalog";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import {
  COURSE_LEVELS,
  LEVEL_LABELS,
  courseSchema,
  isCourseLevel,
  toCoursePayload,
  type CourseFormValues,
} from "../course-schema";

const FIELDS = ["title", "description", "category_id", "level", "price", "cover_url"] as const;
const NO_CATEGORY = 0;

interface CourseFormProps {
  course: Course | null;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  onSubmit: (
    payload: ReturnType<typeof toCoursePayload>,
    onServerError: (error: unknown) => void,
  ) => void;
}

function initialValues(course: Course | null): CourseFormValues {
  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    category_id: course?.category.id ?? NO_CATEGORY,
    level: course && isCourseLevel(course.level) ? course.level : "beginner",
    price: course?.price ?? "0",
    cover_url: course?.cover_url ?? "",
  };
}

export function CourseForm({
  course,
  submitLabel,
  pendingLabel,
  pending,
  onSubmit,
}: CourseFormProps) {
  const categories = useQuery(categoriesQuery());
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialValues(course),
  });
  const { control, register, handleSubmit, setError, formState } = form;
  const { errors, isDirty } = formState;
  const { handleError } = useServerFormErrors<CourseFormValues>({ setError, fields: FIELDS });

  const submit = handleSubmit((values) => {
    onSubmit(toCoursePayload(values), handleError);
  });

  return (
    <form onSubmit={formSubmit(submit)} noValidate className="flex flex-col gap-5">
      <TextField label="Title" error={errors.title?.message} {...register("title")} />
      <TextareaField
        label="Description"
        hint="Shown at the top of the course page."
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="course-category">Category</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value === NO_CATEGORY ? "" : String(field.value)}
                onValueChange={(value) => {
                  field.onChange(Number(value));
                }}
              >
                <SelectTrigger id="course-category" className="h-11 w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category_id ? (
            <p role="alert" className="text-small text-danger-ink">
              {errors.category_id.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="course-level">Level</Label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (isCourseLevel(value)) field.onChange(value);
                }}
              >
                <SelectTrigger id="course-level" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Price in USD"
          inputMode="decimal"
          hint="Use 0 for a free course."
          error={errors.price?.message}
          {...register("price")}
        />
        <TextField
          label="Cover image link"
          type="url"
          hint="Optional. A generated cover is used when empty."
          error={errors.cover_url?.message}
          {...register("cover_url")}
        />
      </div>
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={pending || (course !== null && !isDirty)}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
