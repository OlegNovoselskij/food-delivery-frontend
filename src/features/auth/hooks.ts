import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { authToken } from "@/api/auth-token";
import type { Token } from "@/api/types";

import {
  forgotPassword,
  login,
  loginWithGoogle,
  register,
  resendCode,
  resetPassword,
  verifyEmail,
} from "./api";
import { useAuth } from "./auth-provider";

function storeToken({ access_token }: Token): void {
  authToken.set(access_token);
}

export function useSignInMutation() {
  return useMutation({ mutationFn: login, onSuccess: storeToken });
}

export function useGoogleSignInMutation() {
  return useMutation({ mutationFn: loginWithGoogle, onSuccess: storeToken });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: register });
}

export function useVerifyEmailMutation() {
  return useMutation({ mutationFn: verifyEmail, onSuccess: storeToken });
}

export function useResendCodeMutation() {
  return useMutation({ mutationFn: resendCode });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: resetPassword });
}

export function useSignOut(): () => void {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return () => {
    void navigate("/");
    signOut();
  };
}
