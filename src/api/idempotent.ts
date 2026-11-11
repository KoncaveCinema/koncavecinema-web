import { ErrorCode, isApiError, type ApiErrorCode } from "./errors";
import { http } from "./http";

/*
 * The two writes the API makes safe to repeat with an Idempotency-Key: POST /tickets/reserve and
 * POST /payments/checkout/initialize (koncavecinema-api docs/api/error-codes.md §3). A retry with
 * the same key and the same body gets the first answer back, so nothing is held or charged twice.
 */

// The first request with this key is still running on the API
const STILL_RUNNING: ApiErrorCode[] = [
  ErrorCode.RESERVATION_IN_PROGRESS,
  ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS,
];
const WAIT_MS = 1500;
const MAX_WAITS = 2;

/**
 * Sends the write, and repeats it with the same key and body: once after a network error (a
 * browser can't tell a request that never arrived from an answer that never came back), and up to
 * twice, 1.5 seconds apart, while the first is still running. Any other error is the API's answer.
 *
 * The API matches a retry by its JSON body, field order included, so `data` is sent as given.
 */
export async function sendIdempotent(url: string, data: object, key: string): Promise<unknown> {
  const request = { url, method: "POST", data, headers: { "Idempotency-Key": key } };
  let networkRetried = false;
  let waits = 0;
  for (;;) {
    try {
      return await http(request);
    } catch (error) {
      if (!isApiError(error)) throw error;
      if (error.is(ErrorCode.NETWORK_ERROR) && !networkRetried) {
        networkRetried = true;
        continue;
      }
      if (error.is(...STILL_RUNNING) && waits < MAX_WAITS) {
        waits += 1;
        await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
        continue;
      }
      throw error;
    }
  }
}
