import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";
import { notify } from "@/lib/notify";

import { useForgotPasswordMutation } from "../hooks";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";

const FIELDS = ["email"] as const;

export function Component() {
  const navigate = useNavigate();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { register, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  const forgotPassword = useForgotPasswordMutation();
  const { handleError, cooldown } = useServerFormErrors<ForgotPasswordValues>({
    setError,
    fields: FIELDS,
  });

  const onSubmit = handleSubmit(({ email }) => {
    forgotPassword.mutate(email, {
      onSuccess: () => {
        notify.success("If an account exists for this email, we sent a reset code.");
        void navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      },
      onError: handleError,
    });
  });

  return (
    <>
      <title>Forgot password · Atrium</title>
      <h1 className="text-h1">Reset your password</h1>
      <p className="mt-2.5 text-muted">
        Enter the email you signed up with and we will send you a 6-digit code.
      </p>
      <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4">
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
        <Button type="submit" size="lg" disabled={forgotPassword.isPending || cooldown.active}>
          {forgotPassword.isPending ? "Sending code" : "Send reset code"}
        </Button>
      </form>
      <p className="mt-8 text-small text-muted">
        Remembered it?{" "}
        <Link to="/sign-in" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
