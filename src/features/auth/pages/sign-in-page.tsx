import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";

import { FormError } from "@/components/feedback/form-error";
import { RateLimitNotice } from "@/components/feedback/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { useServerFormErrors } from "@/hooks/use-server-form-errors";
import { formSubmit } from "@/lib/form-submit";

import { GoogleSignIn } from "../components/google-sign-in";
import { useSignInMutation } from "../hooks";
import { signInSchema, type SignInValues } from "../schemas";

const FIELDS = ["email", "password"] as const;

export function Component() {
  const { search } = useLocation();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { register, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  const signIn = useSignInMutation();
  const { handleError, cooldown } = useServerFormErrors<SignInValues>({
    setError,
    fields: FIELDS,
  });

  const onSubmit = handleSubmit((values) => {
    signIn.mutate(values, { onError: handleError });
  });

  return (
    <>
      <title>Sign in · Atrium</title>
      <h1 className="text-h1">Sign in</h1>
      <p className="mt-2.5 text-muted">Welcome back. Continue where you left off.</p>
      <form onSubmit={formSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-1 text-right">
          <Link
            to={{ pathname: "/forgot-password", search }}
            className="text-small font-semibold text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <FormError message={errors.root?.server?.message} />
        <RateLimitNotice secondsLeft={cooldown.secondsLeft} />
        <Button type="submit" size="lg" disabled={signIn.isPending || cooldown.active}>
          {signIn.isPending ? "Signing in" : "Sign in"}
        </Button>
        <GoogleSignIn />
      </form>
      <p className="mt-8 text-small text-muted">
        New to Atrium?{" "}
        <Link
          to={{ pathname: "/sign-up", search }}
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
