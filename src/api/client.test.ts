import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAccessToken, setAccessToken } from "./access-token";
import { api, apiClient, refreshAccessToken } from "./client";
import { ApiError, ErrorCode } from "./errors";

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
  timestamp: "2026-10-20T12:00:00.000Z",
});

describe("api client", () => {
  const originalAdapter = apiClient.defaults.adapter;
  const originalRefreshAdapter = axios.defaults.adapter;

  beforeEach(() => setAccessToken(null));
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    axios.defaults.adapter = originalRefreshAdapter;
  });

  it("returns the envelope's data and sends a request id", async () => {
    let requestId: unknown;
    apiClient.defaults.adapter = stubAdapter((config) => {
      requestId = config.headers.get("X-Request-Id");
      return { status: 200, data: envelope({ id: "m1" }) };
    });

    await expect(api.get("/movies/m1")).resolves.toEqual({ id: "m1" });
    expect(requestId).toMatch(/^web-/);
  });

  it("returns items and pagination meta for list endpoints", async () => {
    const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 200,
      data: envelope([{ id: "m1" }], meta),
    }));

    await expect(api.getPage("/movies")).resolves.toEqual({ items: [{ id: "m1" }], meta });
  });

  it("turns the API error body into an ApiError carrying its code and details", async () => {
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 429,
      data: {
        statusCode: 429,
        code: "LOGIN_TEMPORARILY_LOCKED",
        message: "Too many failed sign-ins.",
        error: "Too Many Requests",
        details: { retryAfterSeconds: 600 },
        timestamp: "2026-10-20T12:00:00.000Z",
        path: "/api/auth/login",
      },
    }));

    const error = await api.post("/auth/login").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).is(ErrorCode.LOGIN_TEMPORARILY_LOCKED)).toBe(true);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).details).toEqual({ retryAfterSeconds: 600 });
  });

  it("refreshes once for concurrent 401s and retries with the new token", async () => {
    setAccessToken("expired");
    apiClient.defaults.adapter = stubAdapter((config) =>
      config.headers.get("Authorization") === "Bearer fresh"
        ? { status: 200, data: envelope("ok") }
        : { status: 401, data: { statusCode: 401, code: "UNAUTHORIZED", message: "x" } },
    );
    const refresh = vi.fn(() => ({
      status: 200,
      data: envelope({ accessToken: "fresh", expiresIn: 900 }),
    }));
    axios.defaults.adapter = stubAdapter(refresh);

    const results = await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);

    expect(results).toEqual(["ok", "ok", "ok"]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe("fresh");
  });

  it("clears the session when the refresh cookie is rejected", async () => {
    setAccessToken("expired");
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 401,
      data: { statusCode: 401, code: "UNAUTHORIZED", message: "x" },
    }));
    axios.defaults.adapter = stubAdapter(() => ({
      status: 401,
      data: { statusCode: 401, code: "REFRESH_TOKEN_INVALID", message: "x" },
    }));

    await expect(api.get("/auth/me")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the session when the refresh can't reach the API", async () => {
    setAccessToken("expired");
    apiClient.defaults.adapter = stubAdapter(() => ({
      status: 401,
      data: { statusCode: 401, code: "UNAUTHORIZED", message: "x" },
    }));
    axios.defaults.adapter = async (config) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    };

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBe("expired");
  });

  it("refreshes under the lock every tab shares", async () => {
    const request = vi.fn((_name: string, task: () => Promise<unknown>) => task());
    Object.defineProperty(navigator, "locks", { value: { request }, configurable: true });
    axios.defaults.adapter = stubAdapter(() => ({
      status: 200,
      data: envelope({ accessToken: "fresh", expiresIn: 900 }),
    }));

    try {
      await expect(refreshAccessToken()).resolves.toBe("fresh");
      expect(request).toHaveBeenCalledWith("koncave-refresh", expect.any(Function));
    } finally {
      Reflect.deleteProperty(navigator, "locks");
    }
  });
});
