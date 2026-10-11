import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import type { AnswerReview } from "@/api/types";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea";
import { QUESTION_TYPES } from "@/features/quiz";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes";
import { formSubmit } from "@/lib/form-submit";
import { GRADING_PATH } from "@/lib/paths";

import {
  buildGradingSchema,
  initialGrades,
  toReviewRequest,
  type GradingFormValues,
} from "../grading-schema";
import { useSubmitReview } from "../hooks";

interface GradingFormProps {
  attemptId: number;
  items: readonly AnswerReview[];
}

function selectedTexts(item: AnswerReview): string[] {
  return item.options
    .filter((option) => item.selected_option_ids.includes(option.id))
    .map((option) => option.text);
}

export function GradingForm({ attemptId, items }: GradingFormProps) {
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(buildGradingSchema(items.map((item) => item.points))),
    defaultValues: initialGrades(items),
  });
  const { register, handleSubmit, setError, formState } = form;
  const { errors, isDirty } = formState;
  const submitReview = useSubmitReview(attemptId);
  const { handleError } = useServerFormErrors<GradingFormValues>({ setError, fields: ["grades"] });
  const navigate = useNavigate();
  const { isSuccess } = submitReview;
  useUnsavedChangesGuard(isDirty && !isSuccess);

  useEffect(() => {
    if (isSuccess) void navigate(GRADING_PATH);
  }, [isSuccess, navigate]);

  const submit = handleSubmit((values) => {
    submitReview.mutate(toReviewRequest(items, values), { onError: handleError });
  });

  return (
    <form onSubmit={formSubmit(submit)} noValidate className="flex flex-col gap-5">
      <ol className="flex flex-col gap-5">
        {items.map((item, index) => (
          <li key={item.question_id} className="rounded-card border border-line bg-surface p-6">
            <p className="text-small font-semibold text-muted">
              Answer {index + 1} of {items.length} · worth {item.points}{" "}
              {item.points === 1 ? "point" : "points"}
            </p>
            <h3 className="mt-1.5 text-h3 font-semibold">{item.question_text}</h3>
            <p className="mt-4 text-small font-semibold text-muted">Student's answer</p>
            <p className="mt-1 whitespace-pre-wrap rounded-control bg-sunken px-3 py-2.5 text-ink-soft">
              {item.question_type === QUESTION_TYPES.text
                ? (item.text_answer ?? "No answer given.")
                : selectedTexts(item).join(", ") || "No answer given."}
            </p>
            {item.explanation ? (
              <p className="mt-3 text-small text-muted">
                <span className="font-semibold">Your explanation: </span>
                {item.explanation}
              </p>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
              <TextField
                label={`Points for answer ${index + 1}`}
                inputMode="numeric"
                hint={`From 0 to ${item.points}`}
                error={errors.grades?.[index]?.points?.message}
                {...register(`grades.${index}.points`)}
              />
              <TextareaField
                label={`Comment for answer ${index + 1}`}
                hint="Optional. The student sees it with the result."
                error={errors.grades?.[index]?.comment?.message}
                className="min-h-20"
                {...register(`grades.${index}.comment`)}
              />
            </div>
          </li>
        ))}
      </ol>
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={submitReview.isPending}>
          {submitReview.isPending ? "Saving grades" : "Save grades"}
        </Button>
      </div>
    </form>
  );
}
