import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import type { QuestionInput } from "@/api/types";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import {
  MAX_OPTIONS,
  QUESTION_TYPES,
  blankOption,
  isQuestionType,
  keepSingleCorrect,
  questionSchema,
  toQuestionPayload,
  type QuestionFormValues,
} from "../question-schema";

const FIELDS = ["text", "question_type", "points", "explanation", "options"] as const;

interface QuestionFormProps {
  initialValues: QuestionFormValues;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  gradingLocked: boolean;
  onSubmit: (payload: QuestionInput, onServerError: (error: unknown) => void) => void;
  onCancel: () => void;
}

export function QuestionForm({
  initialValues,
  submitLabel,
  pendingLabel,
  pending,
  gradingLocked,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: initialValues,
  });
  const { control, register, handleSubmit, setError, setValue, getValues, formState } = form;
  const { errors } = formState;
  const options = useFieldArray({ control, name: "options" });
  const { handleError } = useServerFormErrors<QuestionFormValues>({ setError, fields: FIELDS });
  const questionType = useWatch({ control, name: "question_type" });
  const singleChoice = questionType === "single_choice";
  const optionsError = errors.options?.message ?? errors.options?.root?.message;

  const submit = handleSubmit((values) => {
    onSubmit(toQuestionPayload(values), handleError);
  });

  function markOnlyCorrect(index: number): void {
    setValue("options", keepSingleCorrect(getValues("options"), index), { shouldDirty: true });
  }

  function changeType(next: string): void {
    if (!isQuestionType(next)) return;
    setValue("question_type", next, { shouldDirty: true });
    if (next === "single_choice") {
      markOnlyCorrect(getValues("options").findIndex((option) => option.is_correct));
    }
  }

  return (
    <form onSubmit={formSubmit(submit)} noValidate className="flex flex-col gap-5">
      <TextareaField label="Question" error={errors.text?.message} {...register("text")} />
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <fieldset disabled={gradingLocked} className="min-w-0">
          <legend className="mb-1.5 text-small font-semibold text-ink-soft">Question type</legend>
          <RadioGroup
            value={questionType}
            onValueChange={changeType}
            className="gap-2 sm:grid-cols-3"
            aria-label="Question type"
          >
            {QUESTION_TYPES.map((type) => (
              <RadioCard
                key={type.value}
                value={type.value}
                id={`question-type-${type.value}`}
                label={type.label}
                description={type.description}
                disabled={gradingLocked}
              />
            ))}
          </RadioGroup>
        </fieldset>
        <TextField
          label="Points"
          inputMode="numeric"
          disabled={gradingLocked}
          error={errors.points?.message}
          {...register("points")}
        />
      </div>
      {questionType === "open_text" ? (
        <p className="rounded-control bg-sunken px-3 py-2.5 text-small text-ink-soft">
          Students type their answer. It waits in your grading queue until you give it points.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-small font-semibold text-ink-soft">
            Options. Mark {singleChoice ? "the correct one" : "every correct one"}
          </legend>
          {options.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Controller
                control={control}
                name={`options.${index}.is_correct`}
                render={({ field: correct }) => (
                  <input
                    type={singleChoice ? "radio" : "checkbox"}
                    name={singleChoice ? "correct-option" : undefined}
                    aria-label={`Option ${index + 1} is correct`}
                    className="mt-3 size-5 shrink-0 accent-brand-600"
                    checked={correct.value}
                    disabled={gradingLocked}
                    onChange={(event) => {
                      if (singleChoice) {
                        markOnlyCorrect(index);
                        return;
                      }
                      correct.onChange(event.target.checked);
                    }}
                  />
                )}
              />
              <div className="min-w-0 flex-1">
                <Input
                  aria-label={`Option ${index + 1} text`}
                  aria-invalid={errors.options?.[index]?.text ? true : undefined}
                  {...register(`options.${index}.text`)}
                />
                {errors.options?.[index]?.text ? (
                  <p role="alert" className="mt-1 text-small text-danger-ink">
                    {errors.options[index].text.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove option ${index + 1}`}
                disabled={gradingLocked}
                onClick={() => {
                  options.remove(index);
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <FormError message={optionsError} />
          <div>
            <Button
              type="button"
              variant="link"
              disabled={gradingLocked || options.fields.length >= MAX_OPTIONS}
              onClick={() => {
                options.append(blankOption());
              }}
            >
              <Plus aria-hidden="true" />
              Add option
            </Button>
          </div>
        </fieldset>
      )}
      <TextareaField
        label="Explanation"
        hint="Optional. Shown to students after they finish the quiz."
        error={errors.explanation?.message}
        {...register("explanation")}
      />
      <FormError message={errors.root?.server?.message} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
