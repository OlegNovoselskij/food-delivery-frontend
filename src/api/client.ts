import createClient, { type Middleware } from "openapi-fetch";

import { env } from "@/config/env";

import { authToken } from "./auth-token";
import { apiErrorFromResponse } from "./errors";
import type { paths } from "./schema";

const AUTHORIZATION_HEADER = "Authorization";
const HTTP_UNAUTHORIZED = 401;

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = authToken.get();
    if (token !== null && !request.headers.has(AUTHORIZATION_HEADER)) {
      request.headers.set(AUTHORIZATION_HEADER, `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.ok) return response;
    if (response.status === HTTP_UNAUTHORIZED && request.headers.has(AUTHORIZATION_HEADER)) {
      authToken.clear();
    }
    throw await apiErrorFromResponse(response);
  },
};

export const api = createClient<paths>({
  baseUrl: env.apiUrl,
  fetch: (request) => globalThis.fetch(request),
});

api.use(authMiddleware);
