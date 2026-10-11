import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Review } from "@/api/types";
import { StarInput } from "@/components/domain/rating";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import { useCreateReview, useUpdateReview } from "../hooks";

const COMMENT_MAX_LENGTH = 2000;
const FIELDS = ["rating", "comment"] as const;

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating from 1 to 5 stars").max(5),
  comment: z
    .string()
    .trim()
    .max(COMMENT_MAX_LENGTH, `Use at most ${COMMENT_MAX_LENGTH} characters`),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  courseId: number;
  existing: Review | null;
  onDone: () => void;
}

export function ReviewForm({ courseId, existing, onDone }: ReviewFormProps) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? "" },
  });
  const { control, register, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  const create = useCreateReview(courseId);
  const update = useUpdateReview(courseId, existing?.id ?? 0);
  const mutation = existing ? update : create;
  const { handleError } = useServerFormErrors<ReviewFormValues>({ setError, fields: FIELDS });

  const onSubmit = handleSubmit(({ rating, comment }) => {
    mutation.mutate(
      { rating, comment: comment === "" ? null : comment },
      { onSuccess: onDone, onError: handleError },
    );
  });

  return (
    <form
      onSubmit={formSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6"
    >
      <h3 className="text-h3 font-semibold">{existing ? "Edit your review" : "Write a review"}</h3>
      <div>
        <p className="mb-1.5 text-small font-semibold text-ink-soft" id="review-rating-label">
          Your rating
        </p>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarInput
              value={field.value}
              onChange={field.onChange}
              label="Your rating"
              disabled={mutation.isPending}
            />
          )}
        />
        {errors.rating ? (
          <p role="alert" className="mt-1.5 text-small text-danger-ink">
            {errors.rating.message}
          </p>
        ) : null}
      </div>
      <TextareaField
        label="Comment (optional)"
        error={errors.comment?.message}
        {...register("comment")}
      />
      <FormError message={errors.root?.server?.message} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving" : existing ? "Save review" : "Publish review"}
        </Button>
        {existing ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
