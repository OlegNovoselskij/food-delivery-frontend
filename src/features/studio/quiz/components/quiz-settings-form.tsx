import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { QuizManage } from "@/api/types";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes";
import { formSubmit } from "@/lib/form-submit";

import { useUpdateQuiz } from "../hooks";
import {
  MAX_ATTEMPTS_LIMIT,
  MAX_PASSING_SCORE,
  MIN_PASSING_SCORE,
  quizSchema,
  quizToValues,
  toQuizPayload,
  type QuizFormValues,
} from "../quiz-schema";

const FIELDS = ["title", "passing_score", "max_attempts"] as const;

interface QuizSettingsFormProps {
  courseId: number;
  quiz: QuizManage;
}

export function QuizSettingsForm({ courseId, quiz }: QuizSettingsFormProps) {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: quizToValues(quiz),
  });
  const { register, handleSubmit, setError, reset, formState } = form;
  const { errors, isDirty } = formState;
  const update = useUpdateQuiz(courseId, quiz.id);
  const { handleError } = useServerFormErrors<QuizFormValues>({ setError, fields: FIELDS });
  useUnsavedChangesGuard(isDirty);

  const submit = handleSubmit((values) => {
    update.mutate(toQuizPayload(values), {
      onSuccess: (saved) => {
        reset(quizToValues(saved));
      },
      onError: handleError,
    });
  });

  return (
    <form onSubmit={formSubmit(submit)} noValidate className="flex flex-col gap-4">
      <TextField label="Quiz title" error={errors.title?.message} {...register("title")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Passing score, %"
          inputMode="numeric"
          hint={`From ${MIN_PASSING_SCORE} to ${MAX_PASSING_SCORE}. Students need at least this to pass.`}
          error={errors.passing_score?.message}
          {...register("passing_score")}
        />
        <TextField
          label="Attempts allowed"
          inputMode="numeric"
          hint={`Leave empty for unlimited, or up to ${MAX_ATTEMPTS_LIMIT}.`}
          error={errors.max_attempts?.message}
          {...register("max_attempts")}
        />
      </div>
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? "Saving" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
