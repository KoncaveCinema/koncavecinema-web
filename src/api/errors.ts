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
  LOGIN_TEMPORARILY_LOCKED: "LOGIN_TEMPORARILY_LOCKED", // 429, details.retryAfterSeconds
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
  ALIAS_REQUIRED: "ALIAS_REQUIRED",
  PASSWORD_RESET_TOKEN_INVALID: "PASSWORD_RESET_TOKEN_INVALID",
  ALIAS_CHANGE_TOO_SOON: "ALIAS_CHANGE_TOO_SOON",
  ACCOUNT_HAS_UPCOMING_PASSES: "ACCOUNT_HAS_UPCOMING_PASSES",
  CALLBACK_URL_NOT_ALLOWED: "CALLBACK_URL_NOT_ALLOWED",

  // Email confirmation and two-factor sign-in (dev 9bc5a9f)
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED", // 403, reserve and claim-invite: confirm first
  TWO_FACTOR_REQUIRED: "TWO_FACTOR_REQUIRED", // 403, any admin route: staff set it up first
  TWO_FACTOR_CODE_INVALID: "TWO_FACTOR_CODE_INVALID", // 400/401, wrong or already used
  TWO_FACTOR_CHALLENGE_INVALID: "TWO_FACTOR_CHALLENGE_INVALID", // 401, sign in again
  TWO_FACTOR_ALREADY_ENABLED: "TWO_FACTOR_ALREADY_ENABLED", // 409
  TWO_FACTOR_NOT_ENABLED: "TWO_FACTOR_NOT_ENABLED", // 409
  TWO_FACTOR_SETUP_EXPIRED: "TWO_FACTOR_SETUP_EXPIRED", // 400, start the setup again
  STAFF_TWO_FACTOR_RESET_ONLY: "STAFF_TWO_FACTOR_RESET_ONLY", // 400, a staff account: staff page

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

  // Screening rooms (the /rooms socket answers with these codes too, in room_error)
  ROOM_NOT_FOR_TIER: "ROOM_NOT_FOR_TIER", // 403, Individual Watch has no room
  ROOM_NOT_JOINED: "ROOM_NOT_JOINED", // 403, a room event before join_room
  MESSAGE_BLOCKED: "MESSAGE_BLOCKED", // 400, nothing left once links and numbers were removed
  SUITE_HOST_ONLY: "SUITE_HOST_ONLY", // 403, a host action from a guest
  SUITE_NOT_ADMITTED: "SUITE_NOT_ADMITTED", // 403, a voice token before the host let them in
  SUITE_PAUSE_ALLOWANCE_USED: "SUITE_PAUSE_ALLOWANCE_USED", // 409, the 30 minutes are spent
  VOICE_NOT_AVAILABLE: "VOICE_NOT_AVAILABLE", // 502, LiveKit refused or is unreachable

  // Admin console
  IMAGE_PROVIDER_ERROR: "IMAGE_PROVIDER_ERROR", // 502
  IMAGE_PROVIDER_UNAVAILABLE: "IMAGE_PROVIDER_UNAVAILABLE", // 503
  IMAGE_NOT_UPLOADED: "IMAGE_NOT_UPLOADED", // 400
  IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE", // 400, the file is deleted
  VIDEO_ASSET_IN_USE: "VIDEO_ASSET_IN_USE", // 409
  VIDEO_ASSET_WRONG_KIND: "VIDEO_ASSET_WRONG_KIND", // 400
  VIDEO_ASSET_NOT_READY: "VIDEO_ASSET_NOT_READY", // 409, still processing at Mux
  VIDEO_ASSET_OTHER_MOVIE: "VIDEO_ASSET_OTHER_MOVIE", // 409
  VIDEO_PROVIDER_ERROR: "VIDEO_PROVIDER_ERROR", // 502
  VIDEO_PROVIDER_UNAVAILABLE: "VIDEO_PROVIDER_UNAVAILABLE", // 503
  MOVIE_HAS_ACTIVE_SALES: "MOVIE_HAS_ACTIVE_SALES", // 409, details.paidPasses
  MOVIE_ALREADY_PUBLISHED: "MOVIE_ALREADY_PUBLISHED", // 409
  // Publishing refusals, each 400, checked in this order (announcing needs the last two only)
  MOVIE_NOT_CERTIFIED: "MOVIE_NOT_CERTIFIED",
  MOVIE_MISSING_MASTER_ASSET: "MOVIE_MISSING_MASTER_ASSET",
  MOVIE_MISSING_TRAILER: "MOVIE_MISSING_TRAILER",
  MOVIE_MISSING_POSTERS: "MOVIE_MISSING_POSTERS",
  PRODUCER_SPLIT_LOCKED: "PRODUCER_SPLIT_LOCKED", // 409 once a pass is paid, details.settledPayments
  FEATURED_POSITION_TAKEN: "FEATURED_POSITION_TAKEN", // 409, another placement holds it
  FEATURED_FILM_ALREADY_PLACED: "FEATURED_FILM_ALREADY_PLACED", // 409
  FEATURED_FILM_NOT_PUBLIC: "FEATURED_FILM_NOT_PUBLIC", // 400, a draft can't be featured
  CERTIFICATE_ALREADY_BOUND: "CERTIFICATE_ALREADY_BOUND", // 409, another film has it
  MOVIE_NOT_PUBLISHED: "MOVIE_NOT_PUBLISHED", // 400, only published films are scheduled
  SHOWTIME_START_IN_PAST: "SHOWTIME_START_IN_PAST", // 400
  SHOWTIME_COMPLETED: "SHOWTIME_COMPLETED", // 400
  PRICE_LOCKED_AFTER_SALES: "PRICE_LOCKED_AFTER_SALES", // 409
  PRICE_OUT_OF_RANGE: "PRICE_OUT_OF_RANGE", // 400, NGN 2,500 to 10,000
  CURRENCY_NOT_OFFERED: "CURRENCY_NOT_OFFERED", // 400, showtimes are NGN only
  SHOWTIME_ALREADY_STARTED: "SHOWTIME_ALREADY_STARTED", // 400
  SHOWTIME_CANCELLED: "SHOWTIME_CANCELLED", // 400 to members, 409 to staff
  LAST_SUPER_ADMIN: "LAST_SUPER_ADMIN", // 400 (yourself) or 409 (the last one)
  STAFF_ACCOUNT_EXISTS: "STAFF_ACCOUNT_EXISTS", // 409
  REFUND_NOT_REQUIRED: "REFUND_NOT_REQUIRED", // 409
  REFUND_IN_PROGRESS: "REFUND_IN_PROGRESS", // 409, sent to Paystack and not settled yet
  TICKET_NOT_CANCELLABLE: "TICKET_NOT_CANCELLABLE", // 409, details.seatedGuests for a host

  IDEMPOTENCY_KEY_INVALID: "IDEMPOTENCY_KEY_INVALID",
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED",
  IDEMPOTENCY_REQUEST_IN_PROGRESS: "IDEMPOTENCY_REQUEST_IN_PROGRESS",

  /**
   * Client side only: the request never reached the API (offline, DNS, CORS, timeout, or a
   * proxy or gateway answering 5xx in its place).
   */
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
        details: body.details,
      });
    }

    // A 5xx page that isn't the API's (the dev proxy offline, or a gateway in front of the
    // API): the request never reached it
    if (error.response && error.response.status < 500) {
      return new ApiError({
        status: error.response.status,
        code: ErrorCode.INTERNAL_ERROR,
        messages: [error.message],
        requestId,
      });
    }

    return new ApiError({
      status: error.response?.status ?? 0,
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
