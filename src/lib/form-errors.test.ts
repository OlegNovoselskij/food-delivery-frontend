import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";

import { applyServerError, SERVER_ERROR_FIELD } from "./form-errors";

interface Values {
  email: string;
  password: string;
}

describe("applyServerError", () => {
  it("maps validation issues to their fields", () => {
    const setError = vi.fn();
    const error = new ApiError({
      status: 422,
      message: "Password is too short",
      fieldIssues: [{ field: "password", message: "Password is too short" }],
    });
    applyServerError<Values>(error, setError, ["email", "password"]);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("password", { message: "Password is too short" });
  });

  it("uses the fallback field for messages that name no field", () => {
    const setError = vi.fn();
    const error = new ApiError({ status: 400, message: "The code is invalid or has expired" });
    applyServerError<Values>(error, setError, ["email", "password"], "email");
    expect(setError).toHaveBeenCalledWith("email", {
      message: "The code is invalid or has expired",
    });
  });

  it("falls back to a form level error for unknown fields and plain messages", () => {
    const setError = vi.fn();
    const error = new ApiError({ status: 401, message: "Incorrect email or password" });
    applyServerError<Values>(error, setError, ["email", "password"]);
    expect(setError).toHaveBeenCalledWith(SERVER_ERROR_FIELD, {
      message: "Incorrect email or password",
    });
  });
});
