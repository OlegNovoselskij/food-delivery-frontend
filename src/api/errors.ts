import type { components } from "./schema";

type ValidationIssue = components["schemas"]["ValidationError"];

export interface FieldIssue {
  field: string;
  message: string;
}

interface ApiErrorInit {
  status: number;
  message: string;
  fieldIssues?: FieldIssue[];
  requestId?: string | null;
  retryAfter?: number | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldIssues: FieldIssue[];
  readonly requestId: string | null;
  readonly retryAfter: number | null;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.fieldIssues = init.fieldIssues ?? [];
    this.requestId = init.requestId ?? null;
    this.retryAfter = init.retryAfter ?? null;
  }
}

export const NETWORK_ERROR_STATUS = 0;

const FALLBACK_MESSAGES: Record<number, string> = {
  [NETWORK_ERROR_STATUS]: "Cannot reach the server. Check your connection and try again.",
  401: "Your session has expired. Sign in again.",
  403: "You do not have access to this.",
  404: "We could not find what you were looking for.",
  429: "Too many requests. Wait a moment and try again.",
  500: "Something went wrong on our side. Try again in a moment.",
};

const GENERIC_MESSAGE = "Something went wrong. Try again.";
const VALUE_ERROR_PREFIX = /^Value error, /;
const IGNORED_LOCATION_PARTS = new Set(["body", "query", "path"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return isRecord(value) && typeof value.msg === "string" && Array.isArray(value.loc);
}

function issueField(issue: ValidationIssue): string {
  return issue.loc.filter((part) => !IGNORED_LOCATION_PARTS.has(String(part))).join(".");
}

function parseRetryAfter(body: Record<string, unknown>, header: string | null): number | null {
  const fromBody = body.retry_after;
  if (typeof fromBody === "number") return fromBody;
  const fromHeader = header === null ? Number.NaN : Number(header);
  return Number.isFinite(fromHeader) ? fromHeader : null;
}

export function fallbackMessage(status: number): string {
  return FALLBACK_MESSAGES[status] ?? GENERIC_MESSAGE;
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  const record = isRecord(body) ? body : {};
  const detail = record.detail;
  const bodyRequestId = record.request_id;
  const requestId =
    response.headers.get("X-Request-ID") ??
    (typeof bodyRequestId === "string" ? bodyRequestId : null);
  const retryAfter = parseRetryAfter(record, response.headers.get("Retry-After"));

  if (Array.isArray(detail)) {
    const fieldIssues = detail.filter(isValidationIssue).map((issue) => ({
      field: issueField(issue),
      message: issue.msg.replace(VALUE_ERROR_PREFIX, ""),
    }));
    const first = fieldIssues[0];
    return new ApiError({
      status: response.status,
      message: first ? first.message : fallbackMessage(response.status),
      fieldIssues,
      requestId,
      retryAfter,
    });
  }

  return new ApiError({
    status: response.status,
    message: typeof detail === "string" ? detail : fallbackMessage(response.status),
    requestId,
    retryAfter,
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError({
    status: NETWORK_ERROR_STATUS,
    message: fallbackMessage(NETWORK_ERROR_STATUS),
  });
}
