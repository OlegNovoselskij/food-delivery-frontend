import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type {
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyRegistrationRequest,
} from "@/api/types";
import { unwrap } from "@/api/unwrap";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function currentUserQuery(enabled: boolean) {
  return queryOptions({
    queryKey: authKeys.me,
    queryFn: () => unwrap(api.GET("/api/v1/users/me")),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function login(body: LoginRequest) {
  return unwrap(api.POST("/api/v1/auth/login", { body }));
}

export function register(body: RegisterRequest) {
  return unwrap(api.POST("/api/v1/auth/register", { body }));
}

export function verifyEmail(body: VerifyRegistrationRequest) {
  return unwrap(api.POST("/api/v1/auth/verify-email", { body }));
}

export function resendCode(email: string) {
  return unwrap(api.POST("/api/v1/auth/resend-code", { body: { email } }));
}

export function forgotPassword(email: string) {
  return unwrap(api.POST("/api/v1/auth/forgot-password", { body: { email } }));
}

export function resetPassword(body: ResetPasswordRequest) {
  return unwrap(api.POST("/api/v1/auth/reset-password", { body }));
}

export function requestGoogleNonce() {
  return unwrap(api.POST("/api/v1/auth/google/nonce"));
}

export function loginWithGoogle(body: GoogleLoginRequest) {
  return unwrap(api.POST("/api/v1/auth/google", { body }));
}
