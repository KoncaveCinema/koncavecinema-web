import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, ErrorCode } from "./errors";
import { http } from "./http";
import { sendIdempotent } from "./idempotent";

vi.mock("./http", () => ({ http: vi.fn() }));

const httpMock = vi.mocked(http);
const failure = (code: string, status = 409) => new ApiError({ status, code, messages: [code] });
const body = { showtimeId: "s1", tier: "INDIVIDUAL" };

describe("sendIdempotent (reserve and checkout)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    httpMock.mockReset();
  });

  it("repeats once after a network error, with the same key and body", async () => {
    httpMock.mockRejectedValueOnce(failure(ErrorCode.NETWORK_ERROR, 0)).mockResolvedValueOnce({
      ticketId: "t1",
    });

    await expect(sendIdempotent("/tickets/reserve", body, "key-0001")).resolves.toEqual({
      ticketId: "t1",
    });
    expect(httpMock).toHaveBeenCalledTimes(2);
    for (const [request] of httpMock.mock.calls) {
      expect(request).toMatchObject({ data: body, headers: { "Idempotency-Key": "key-0001" } });
    }
  });

  it("gives up after a second network error", async () => {
    httpMock.mockRejectedValue(failure(ErrorCode.NETWORK_ERROR, 0));

    await expect(sendIdempotent("/tickets/reserve", body, "key-0001")).rejects.toMatchObject({
      code: ErrorCode.NETWORK_ERROR,
    });
    expect(httpMock).toHaveBeenCalledTimes(2);
  });

  it("waits while the first request is still running, at most twice", async () => {
    httpMock.mockRejectedValue(failure(ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS));

    const sent = sendIdempotent("/payments/checkout/initialize", { ticketId: "t1" }, "key-0002");
    const settled = expect(sent).rejects.toMatchObject({
      code: ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS,
    });
    await vi.advanceTimersByTimeAsync(3000);
    await settled;
    expect(httpMock).toHaveBeenCalledTimes(3);
  });

  it("returns the API's refusal without repeating it", async () => {
    httpMock.mockRejectedValue(failure(ErrorCode.SCREENING_SOLD_OUT));

    await expect(sendIdempotent("/tickets/reserve", body, "key-0003")).rejects.toMatchObject({
      code: ErrorCode.SCREENING_SOLD_OUT,
    });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });
});
