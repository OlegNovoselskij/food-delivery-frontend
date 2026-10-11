import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";

import { CodeInput } from "@/components/domain/code-input";
import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { useCooldown } from "@/hooks/use-cooldown";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";
import { notify } from "@/lib/notify";

import { ResendCodeButton } from "../components/resend-code-button";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../hooks";
import {
  CODE_RESEND_SECONDS,
  PASSWORD_HINT,
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas";

const FIELDS = ["email", "code", "new_password"] as const;
const CODE_ERROR_ID = "reset-code-error";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: params.get("email") ?? "", code: "", new_password: "" },
  });
  const { control, register, handleSubmit, setError, getValues, trigger, formState } = form;
  const { errors } = formState;
  const resetPassword = useResetPasswordMutation();
  const sendCode = useForgotPasswordMutation();
  const resendCooldown = useCooldown();
  const { handleError, cooldown } = useServerFormErrors<ResetPasswordValues>({
    setError,
    fields: FIELDS,
    fallbackField: "code",
  });

  const onSubmit = handleSubmit((values) => {
    resetPassword.mutate(values, {
      onSuccess: () => {
        notify.success("Password changed. Sign in with your new password.");
        void navigate("/sign-in");
      },
      onError: handleError,
    });
  });

  async function resendCode(): Promise<void> {
    if (!(await trigger("email"))) return;
    sendCode.mutate(getValues("email"), {
      onSuccess: () => {
        notify.success("If an account exists for this email, we sent a new code.");
        resendCooldown.start(CODE_RESEND_SECONDS);
      },
      onError: notify.error,
    });
  }

  return (
    <>
      <title>Reset password · Atrium</title>
      <h1 className="text-h1">Choose a new password</h1>
      <p className="mt-2.5 max-w-md text-muted">
        Enter the 6-digit code from your email and a new password. Every device is signed out after
        the change.
      </p>
      <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex flex-col gap-2">
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <CodeInput
                value={field.value}
                onChange={field.onChange}
                label="Reset code"
                invalid={errors.code !== undefined}
                describedBy={errors.code ? CODE_ERROR_ID : undefined}
              />
            )}
          />
          {errors.code ? (
            <p id={CODE_ERROR_ID} role="alert" className="text-small text-danger-ink">
              {errors.code.message}
            </p>
          ) : null}
          <ResendCodeButton
            secondsLeft={resendCooldown.secondsLeft}
            pending={sendCode.isPending}
            onResend={() => {
              void resendCode();
            }}
          />
        </div>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.new_password?.message}
          {...register("new_password")}
        />
        <FormError message={errors.root?.server?.message} />
        <RateLimitNotice secondsLeft={cooldown.secondsLeft} />
        <Button type="submit" size="lg" disabled={resetPassword.isPending || cooldown.active}>
          {resetPassword.isPending ? "Changing password" : "Change password"}
        </Button>
      </form>
      <p className="mt-8 text-small text-muted">
        <Link to="/sign-in" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
