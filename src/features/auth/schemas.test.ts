import { describe, expect, it } from "vitest";

import {
  codeSchema,
  passwordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpDetailsSchema,
} from "./schemas";

describe("passwordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("long-enough").success).toBe(true);
  });

  it("limits the password to 72 bytes, not characters", () => {
    expect(passwordSchema.safeParse("я".repeat(36)).success).toBe(true);
    expect(passwordSchema.safeParse("я".repeat(37)).success).toBe(false);
  });
});

describe("codeSchema", () => {
  it("accepts exactly six digits", () => {
    expect(codeSchema.safeParse("123456").success).toBe(true);
    expect(codeSchema.safeParse("12345").success).toBe(false);
    expect(codeSchema.safeParse("12345a").success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("reports an invalid email and an empty password", () => {
    const result = signInSchema.safeParse({ email: "nope", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join("."));
      expect(fields).toEqual(["email", "password"]);
    }
  });
});

describe("signUpDetailsSchema", () => {
  it("trims names and rejects empty ones", () => {
    expect(
      signUpDetailsSchema.safeParse({ name: " ", surname: "K", email: "a@b.co" }).success,
    ).toBe(false);
    const parsed = signUpDetailsSchema.parse({ name: " Ann ", surname: "K", email: "a@b.co" });
    expect(parsed.name).toBe("Ann");
  });
});

describe("resetPasswordSchema", () => {
  it("validates the three fields together", () => {
    const result = resetPasswordSchema.safeParse({
      email: "a@b.co",
      code: "123456",
      new_password: "new-password-1",
    });
    expect(result.success).toBe(true);
  });
});
