import { describe, expect, it } from "vitest";

import { ApiError, apiErrorFromResponse, toApiError } from "./errors";

function jsonResponse(body: unknown, init: { status: number; headers?: Record<string, string> }) {
  return new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

describe("apiErrorFromResponse", () => {
  it("uses a string detail as the message", async () => {
    const error = await apiErrorFromResponse(
      jsonResponse({ detail: "Invalid credentials" }, { status: 401 }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid credentials");
  });

  it("maps validation issues to fields and strips the Pydantic prefix", async () => {
    const error = await apiErrorFromResponse(
      jsonResponse(
        {
          detail: [
            { loc: ["body", "password"], msg: "Value error, Password is too short", type: "x" },
          ],
        },
        { status: 422 },
      ),
    );
    expect(error.fieldIssues).toEqual([{ field: "password", message: "Password is too short" }]);
    expect(error.message).toBe("Password is too short");
  });

  it("reads the retry delay and the request id", async () => {
    const error = await apiErrorFromResponse(
      jsonResponse(
        { detail: "Too many requests, try again later", retry_after: 42 },
        { status: 429, headers: { "X-Request-ID": "abc123" } },
      ),
    );
    expect(error.retryAfter).toBe(42);
    expect(error.requestId).toBe("abc123");
  });

  it("falls back to a readable message when the body is not JSON", async () => {
    const error = await apiErrorFromResponse(new Response("boom", { status: 500 }));
    expect(error.message).toBe("Something went wrong on our side. Try again in a moment.");
  });
});

describe("toApiError", () => {
  it("keeps an ApiError as it is", () => {
    const original = new ApiError({ status: 404, message: "Not here" });
    expect(toApiError(original)).toBe(original);
  });

  it("turns an unknown failure into a network error", () => {
    const error = toApiError(new TypeError("Failed to fetch"));
    expect(error.status).toBe(0);
    expect(error.message).toContain("Cannot reach the server");
  });
});
