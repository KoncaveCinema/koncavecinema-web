import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type Reply = { status: number; data: unknown };

/** Answers every request through `handler`, the way the real API would. */
function stubAdapter(handler: (config: InternalAxiosRequestConfig) => Reply): AxiosAdapter {
  return async (config) => {
    const { status, data } = handler(config);
    const response = { status, data, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw new AxiosError("Request failed", undefined, config, undefined, response);
    }
    return response;
  };
}

const envelope = (data: unknown, meta?: unknown) => ({
  statusCode: 200,
  success: true,
  data,
  ...(meta ? { meta } : {}),
  timestamp: "2026-11-06T12:00:00.000Z",
});

/* Fresh modules per test: the start-up session wait is settled once per page load */
async function load() {
  vi.resetModules();
  const token = await import("./access-token");
  const { apiClient } = await import("./client");
  const { http } = await import("./http");
  return { http, apiClient, ...token };
}

describe("http (every module's request function)", () => {
  // The first import validates the environment and builds the client: once, outside the tests
  beforeAll(() => import("./http"), 30_000);
  afterEach(() => vi.restoreAllMocks());

  it("resolves to the envelope's data", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    apiClient.defaults.adapter = stubAdapter(() => ({ status: 200, data: envelope({ id: "m1" }) }));

    await expect(http({ url: "/movies/m1", method: "GET" })).resolves.toEqual({ id: "m1" });
  });

  it("resolves a paginated list to its items and meta", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 200,
      data: envelope([{ id: "m1" }], meta),
    }));

    await expect(http({ url: "/movies", method: "GET" })).resolves.toEqual({
      items: [{ id: "m1" }],
      meta,
    });
  });

  it("resolves an empty reply (204) to undefined", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    apiClient.defaults.adapter = stubAdapter(() => ({ status: 204, data: "" }));

    await expect(http({ url: "/admin/movies/m1", method: "DELETE" })).resolves.toBeUndefined();
  });

  it("sends the caller's headers, such as the idempotency key", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    let headers: InternalAxiosRequestConfig["headers"] | undefined;
    apiClient.defaults.adapter = stubAdapter((config) => {
      headers = config.headers;
      return { status: 201, data: envelope({ ticketId: "t1" }) };
    });

    await http({ url: "/tickets/reserve", method: "POST", headers: { "Idempotency-Key": "k1" } });

    expect(headers?.get("Idempotency-Key")).toBe("k1");
    expect(headers?.get("X-Request-Id")).toMatch(/^web-/);
  });

  it("waits for the start-up session before sending, then carries its token", async () => {
    const { http, apiClient, setAccessToken } = await load();
    const sent = vi.fn((config: InternalAxiosRequestConfig) => ({
      status: 200,
      data: envelope(config.headers.get("Authorization")),
    }));
    apiClient.defaults.adapter = stubAdapter(sent);

    const pending = http({ url: "/tickets/my-tickets", method: "GET" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sent).not.toHaveBeenCalled();

    setAccessToken("restored");
    await expect(pending).resolves.toBe("Bearer restored");
  });

  it("sends sign-in without waiting for the session", async () => {
    const { http, apiClient } = await load();
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 200,
      data: envelope({ accessToken: "a" }),
    }));

    await expect(http({ url: "/auth/login", method: "POST" })).resolves.toEqual({
      accessToken: "a",
    });
  });

  it("rejects with the API's error code", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 400,
      data: {
        statusCode: 400,
        code: "MOVIE_NOT_CERTIFIED",
        message: "Bind the NFVCB certificate first.",
        error: "Bad Request",
        timestamp: "2026-11-06T12:00:00.000Z",
        path: "/api/admin/movies/m1/publish",
      },
    }));

    await expect(http({ url: "/admin/movies/m1/publish", method: "PATCH" })).rejects.toMatchObject({
      code: "MOVIE_NOT_CERTIFIED",
      status: 400,
    });
  });

  it("treats a proxy's or gateway's own error page as the API being unreachable", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 500,
      data: "Internal Server Error",
    }));

    await expect(http({ url: "/auth/login", method: "POST" })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 500,
    });
  });

  it("keeps the API's own 5xx errors as they are", async () => {
    const { http, apiClient, setAccessToken } = await load();
    setAccessToken(null);
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 503,
      data: {
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
        message: "Payments are paused.",
        timestamp: "2026-11-06T12:00:00.000Z",
        path: "/api/payments",
      },
    }));

    await expect(http({ url: "/payments", method: "POST" })).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      status: 503,
    });
  });
});
