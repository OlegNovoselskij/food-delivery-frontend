import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";

import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import { useRegisterMutation } from "../hooks";
import { SELF_SERVICE_ROLE, signUpDetailsSchema, type SignUpDetailsValues } from "../schemas";
import { GoogleSignIn } from "./google-sign-in";

const FIELDS = ["name", "surname", "email"] as const;

interface SignUpDetailsFormProps {
  initialValues: SignUpDetailsValues;
  onRegistered: (values: SignUpDetailsValues) => void;
}

export function SignUpDetailsForm({ initialValues, onRegistered }: SignUpDetailsFormProps) {
  const { search } = useLocation();
  const form = useForm<SignUpDetailsValues>({
    resolver: zodResolver(signUpDetailsSchema),
    defaultValues: initialValues,
  });
  const { register, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  const registerAccount = useRegisterMutation();
  const { handleError, cooldown } = useServerFormErrors<SignUpDetailsValues>({
    setError,
    fields: FIELDS,
    fallbackField: "email",
  });

  const onSubmit = handleSubmit((values) => {
    registerAccount.mutate(
      { ...values, role: SELF_SERVICE_ROLE },
      {
        onSuccess: () => {
          onRegistered(values);
        },
        onError: handleError,
      },
    );
  });

  return (
    <>
      <h1 className="text-h1">Create your account</h1>
      <p className="mt-2.5 text-muted">
        Enter your details and we will send a 6-digit code to confirm your email.
      </p>
      <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4">
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
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormError message={errors.root?.server?.message} />
        <RateLimitNotice secondsLeft={cooldown.secondsLeft} />
        <Button type="submit" size="lg" disabled={registerAccount.isPending || cooldown.active}>
          {registerAccount.isPending ? "Sending code" : "Send confirmation code"}
        </Button>
        <GoogleSignIn />
      </form>
      <p className="mt-8 text-small text-muted">
        Already have an account?{" "}
        <Link
          to={{ pathname: "/sign-in", search }}
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
