import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const CODE_LENGTH = 6;
const NAME_MAX_LENGTH = 50;

const utf8Length = (value: string): number => new TextEncoder().encode(value).length;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(
    (value) => utf8Length(value) <= PASSWORD_MAX_BYTES,
    `Use at most ${PASSWORD_MAX_BYTES} bytes, about ${PASSWORD_MAX_BYTES} Latin characters`,
  );

export const codeSchema = z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), {
  message: `Enter all ${CODE_LENGTH} digits of the code`,
});

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(NAME_MAX_LENGTH, `Use at most ${NAME_MAX_LENGTH} characters`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const signUpDetailsSchema = z.object({
  name: nameSchema("first name"),
  surname: nameSchema("last name"),
  email: emailSchema,
});

export const verifyEmailSchema = z.object({
  code: codeSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  new_password: passwordSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpDetailsValues = z.infer<typeof signUpDetailsSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const SELF_SERVICE_ROLE = "student";
export const CODE_RESEND_SECONDS = 60;
export const CODE_VALID_MINUTES = 10;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters`;
