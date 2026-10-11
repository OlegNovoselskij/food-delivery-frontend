import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { User } from "@/api/types";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import { useUpdateProfileMutation } from "../hooks";
import { BIO_MAX_LENGTH, profileSchema, type ProfileValues } from "../schemas";

const FIELDS = ["name", "surname", "phone", "bio"] as const;

function valuesFromUser(user: User): ProfileValues {
  return {
    name: user.name,
    surname: user.surname,
    phone: user.phone ?? "",
    bio: user.bio ?? "",
  };
}

export function ProfileForm({ user }: { user: User }) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: valuesFromUser(user),
  });
  const { register, handleSubmit, setError, reset, formState } = form;
  const { errors, isDirty } = formState;
  const update = useUpdateProfileMutation();
  const { handleError } = useServerFormErrors<ProfileValues>({ setError, fields: FIELDS });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      {
        name: values.name,
        surname: values.surname,
        phone: values.phone === "" ? null : values.phone,
        bio: values.bio === "" ? null : values.bio,
      },
      {
        onSuccess: (saved) => {
          reset(valuesFromUser(saved));
        },
        onError: handleError,
      },
    );
  });

  return (
    <form onSubmit={formSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          autoComplete="given-name"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Last name"
          autoComplete="family-name"
          error={errors.surname?.message}
          {...register("surname")}
        />
      </div>
      <TextField
        label="Phone"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <TextareaField
        label="About you"
        hint={`Up to ${BIO_MAX_LENGTH} characters. Teachers show this on their course pages.`}
        error={errors.bio?.message}
        {...register("bio")}
      />
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
