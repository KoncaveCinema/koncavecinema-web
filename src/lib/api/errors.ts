import { isAxiosError } from "axios";

import type { ApiErrorBody } from "./types";

/**
 * Stable error codes from koncavecinema-api (docs/api/error-codes.md). Branch on these, never on
 * the message. Codes added to the API later still arrive as plain strings.
 */
export const ErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE: "UNPROCESSABLE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_GATEWAY: "BAD_GATEWAY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  REFRESH_TOKEN_MISSING: "REFRESH_TOKEN_MISSING",
  REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  TOKEN_REVOKED: "TOKEN_REVOKED",
  INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE",
  KYC_ALREADY_VERIFIED: "KYC_ALREADY_VERIFIED",
  PHONE_ALREADY_LINKED: "PHONE_ALREADY_LINKED",
  OTP_RATE_LIMITED: "OTP_RATE_LIMITED",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  ALIAS_TAKEN: "ALIAS_TAKEN",
  PASSWORD_RESET_TOKEN_INVALID: "PASSWORD_RESET_TOKEN_INVALID",
  ALIAS_CHANGE_TOO_SOON: "ALIAS_CHANGE_TOO_SOON",
  ACCOUNT_HAS_UPCOMING_PASSES: "ACCOUNT_HAS_UPCOMING_PASSES",
  CALLBACK_URL_NOT_ALLOWED: "CALLBACK_URL_NOT_ALLOWED",

  KYC_REQUIRED: "KYC_REQUIRED",
  RESERVATION_IN_PROGRESS: "RESERVATION_IN_PROGRESS",
  RESERVATION_ALREADY_HELD: "RESERVATION_ALREADY_HELD",
  SCREENING_CONCLUDED: "SCREENING_CONCLUDED",
  SCREENING_SOLD_OUT: "SCREENING_SOLD_OUT",
  TICKET_NOT_RELEASABLE: "TICKET_NOT_RELEASABLE",
  PASS_NOT_CONFIRMED: "PASS_NOT_CONFIRMED",
  SUITE_NOT_ACTIVE: "SUITE_NOT_ACTIVE",
  SUITE_CLAIM_IN_PROGRESS: "SUITE_CLAIM_IN_PROGRESS",
  SUITE_FULL: "SUITE_FULL",
  TICKET_NOT_PAYABLE: "TICKET_NOT_PAYABLE",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
  PAYMENT_GATEWAY_UNAVAILABLE: "PAYMENT_GATEWAY_UNAVAILABLE",

  STREAM_NOT_OPEN: "STREAM_NOT_OPEN",
  STREAM_CLOSED: "STREAM_CLOSED",
  STREAM_NOT_READY: "STREAM_NOT_READY",
  STREAM_IN_USE_ON_ANOTHER_DEVICE: "STREAM_IN_USE_ON_ANOTHER_DEVICE",
  STREAM_SESSION_INVALID: "STREAM_SESSION_INVALID",
  STREAM_DRM_NOT_ENABLED: "STREAM_DRM_NOT_ENABLED",
  LOCATION_VERIFICATION_REQUIRED: "LOCATION_VERIFICATION_REQUIRED",

  // Admin console
  IMAGE_PROVIDER_ERROR: "IMAGE_PROVIDER_ERROR", // 502
  IMAGE_PROVIDER_UNAVAILABLE: "IMAGE_PROVIDER_UNAVAILABLE", // 503
  IMAGE_NOT_UPLOADED: "IMAGE_NOT_UPLOADED", // 400
  IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE", // 400, the file is deleted
  VIDEO_ASSET_IN_USE: "VIDEO_ASSET_IN_USE", // 409
  VIDEO_ASSET_WRONG_KIND: "VIDEO_ASSET_WRONG_KIND", // 400
  MOVIE_HAS_ACTIVE_SALES: "MOVIE_HAS_ACTIVE_SALES", // 409, details.paidPasses
  MOVIE_ALREADY_PUBLISHED: "MOVIE_ALREADY_PUBLISHED", // 409
  SHOWTIME_ALREADY_STARTED: "SHOWTIME_ALREADY_STARTED", // 400
  SHOWTIME_CANCELLED: "SHOWTIME_CANCELLED", // 400 to members, 409 to staff
  LAST_SUPER_ADMIN: "LAST_SUPER_ADMIN", // 400 (yourself) or 409 (the last one)
  STAFF_ACCOUNT_EXISTS: "STAFF_ACCOUNT_EXISTS", // 409
  REFUND_NOT_REQUIRED: "REFUND_NOT_REQUIRED", // 409
  TICKET_NOT_CANCELLABLE: "TICKET_NOT_CANCELLABLE", // 409, details.seatedGuests for a host

  IDEMPOTENCY_KEY_INVALID: "IDEMPOTENCY_KEY_INVALID",
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED",
  IDEMPOTENCY_REQUEST_IN_PROGRESS: "IDEMPOTENCY_REQUEST_IN_PROGRESS",

  /** Client side only: the request never reached the API (offline, DNS, CORS, timeout). */
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type KnownErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
// Keeps autocomplete for known codes while accepting codes added to the API later
export type ApiErrorCode = KnownErrorCode | (string & {});

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Field messages for `VALIDATION_FAILED`, otherwise a single entry. */
  readonly messages: string[];
  /** Quote this when reporting a problem; every API log line for the request carries it. */
  readonly requestId: string | undefined;
  /** Extra fields some errors carry, e.g. `ticketId` on RESERVATION_ALREADY_HELD */
  readonly details: Record<string, unknown>;

  constructor(params: {
    status: number;
    code: ApiErrorCode;
    messages: string[];
    requestId?: string;
    details?: Record<string, unknown>;
  }) {
    super(params.messages[0] ?? params.code);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.messages = params.messages;
    this.requestId = params.requestId;
    this.details = params.details ?? {};
  }

  is(...codes: ApiErrorCode[]): boolean {
    return codes.includes(this.code);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null && "code" in value && "statusCode" in value;
}

/** Converts anything thrown by axios into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const requestId = error.config?.headers?.["X-Request-Id"] as string | undefined;
    const body: unknown = error.response?.data;

    if (error.response && isApiErrorBody(body)) {
      return new ApiError({
        status: body.statusCode,
        code: body.code,
        messages: Array.isArray(body.message) ? body.message : [body.message],
        requestId,
        details: body as unknown as Record<string, unknown>,
      });
    }

    if (error.response) {
      return new ApiError({
        status: error.response.status,
        code: ErrorCode.INTERNAL_ERROR,
        messages: [error.message],
        requestId,
      });
    }

    return new ApiError({
      status: 0,
      code: ErrorCode.NETWORK_ERROR,
      messages: ["We could not reach Koncave Cinema. Check your connection and try again."],
      requestId,
    });
  }

  return new ApiError({
    status: 0,
    code: ErrorCode.INTERNAL_ERROR,
    messages: [error instanceof Error ? error.message : "Unexpected error."],
  });
}
