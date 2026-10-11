import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { server } from "@/test/server";

import { authToken } from "./auth-token";
import { api } from "./client";
import { ApiError } from "./errors";
import { unwrap } from "./unwrap";

const ME_URL = "http://localhost:8000/api/v1/users/me";

afterEach(() => {
  authToken.clear();
});

describe("api client", () => {
  it("sends the bearer token when signed in", async () => {
    let received: string | null = null;
    server.use(
      http.get(ME_URL, ({ request }) => {
        received = request.headers.get("Authorization");
        return HttpResponse.json({ id: 1 });
      }),
    );
    authToken.set("token-1");
    await api.GET("/api/v1/users/me");
    expect(received).toBe("Bearer token-1");
  });

  it("clears the token and throws an ApiError on 401 for an authenticated call", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json({ detail: "Expired" }, { status: 401 })));
    authToken.set("token-2");
    await expect(unwrap(api.GET("/api/v1/users/me"))).rejects.toMatchObject({
      status: 401,
      message: "Expired",
    });
    expect(authToken.get()).toBeNull();
  });

  it("keeps the token and throws ApiError on 403", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json({ detail: "Nope" }, { status: 403 })));
    authToken.set("token-3");
    await expect(api.GET("/api/v1/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(authToken.get()).toBe("token-3");
  });
});
