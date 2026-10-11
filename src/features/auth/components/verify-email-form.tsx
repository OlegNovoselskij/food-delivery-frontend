import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { CodeInput } from "@/components/domain/code-input";
import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { useCooldown } from "@/hooks/use-cooldown";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";
import { notify } from "@/lib/notify";

import { useResendCodeMutation, useVerifyEmailMutation } from "../hooks";
import {
  CODE_RESEND_SECONDS,
  CODE_VALID_MINUTES,
  PASSWORD_HINT,
  verifyEmailSchema,
  type VerifyEmailValues,
} from "../schemas";
import { ResendCodeButton } from "./resend-code-button";

const FIELDS = ["code", "password"] as const;
const CODE_ERROR_ID = "verify-code-error";

interface VerifyEmailFormProps {
  email: string;
  onChangeEmail: () => void;
}

export function VerifyEmailForm({ email, onChangeEmail }: VerifyEmailFormProps) {
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "", password: "" },
  });
  const { control, register, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  const verify = useVerifyEmailMutation();
  const resend = useResendCodeMutation();
  const { handleError, cooldown } = useServerFormErrors<VerifyEmailValues>({
    setError,
    fields: FIELDS,
    fallbackField: "code",
  });
  const resendCooldown = useCooldown();
  const { start: startResendCooldown } = resendCooldown;

  useEffect(() => {
    startResendCooldown(CODE_RESEND_SECONDS);
  }, [startResendCooldown]);

  const onSubmit = handleSubmit(({ code, password }) => {
    verify.mutate(
      { email, code, password },
      {
        onSuccess: () => {
          notify.success("Account created. Welcome to Atrium.");
        },
        onError: handleError,
      },
    );
  });

  function resendCode(): void {
    resend.mutate(email, {
      onSuccess: () => {
        notify.success(`We sent a new code to ${email}.`);
        startResendCooldown(CODE_RESEND_SECONDS);
      },
      onError: notify.error,
    });
  }

  return (
    <>
      <h1 className="text-h1">Check your email</h1>
      <p className="mt-2.5 max-w-md text-muted">
        We sent a 6-digit code to <strong className="text-ink">{email}</strong>. It expires in{" "}
        {CODE_VALID_MINUTES} minutes.{" "}
        <button
          type="button"
          onClick={onChangeEmail}
          className="rounded-sm font-semibold text-brand-700 hover:underline"
        >
          Change email
        </button>
      </p>
      <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <CodeInput
                value={field.value}
                onChange={field.onChange}
                label="Confirmation code"
                invalid={errors.code !== undefined}
                focusOnMount
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
            pending={resend.isPending}
            onResend={resendCode}
          />
        </div>
        <PasswordField
          label="Create a password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register("password")}
        />
        <FormError message={errors.root?.server?.message} />
        <RateLimitNotice secondsLeft={cooldown.secondsLeft} />
        <Button type="submit" size="lg" disabled={verify.isPending || cooldown.active}>
          {verify.isPending ? "Creating account" : "Create account"}
        </Button>
      </form>
    </>
  );
}
