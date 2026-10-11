import { ApiError, fallbackMessage } from "./errors";

interface FetchResult<T> {
  data?: T;
  response: Response;
}

export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, response } = await request;
  if (data === undefined) {
    throw new ApiError({ status: response.status, message: fallbackMessage(response.status) });
  }
  return data;
}

export async function unwrapEmpty(request: Promise<{ response: Response }>): Promise<void> {
  await request;
}
