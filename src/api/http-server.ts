import "server-only";

import axios, { isAxiosError, type AxiosRequestConfig } from "axios";

import { env } from "@/env";

import { unwrapEnvelope } from "./envelope";
import { ErrorCode, isApiError, toApiError } from "./errors";

/**
 * Client for Server Components and route handlers: public, anonymous data only (catalog, film
 * pages, showtimes). It never carries a user's token or cookies, so its responses can be cached
 * with `"use cache"` and shared between visitors.
 */
const serverClient = axios.create({
  // Locally, straight to the API the dev proxy forwards to (no cookies here, so no proxy needed)
  baseURL: env.API_DEV_PROXY_URL ?? env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

serverClient.interceptors.request.use((config) => {
  config.headers.set("X-Request-Id", `web-ssr-${crypto.randomUUID()}`);
  return config;
});

/*
 * API_DEBUG=true: one terminal line per call, plus the full body when it fails. Cached reads only
 * reach the API on a cache miss, so a page load served from the cache prints nothing.
 */
if (env.API_DEBUG && env.NODE_ENV !== "production") {
  const startedAt = new WeakMap<object, number>();
  const describe = (config: AxiosRequestConfig, outcome: string | number) => {
    const url = serverClient.getUri(config).replace(serverClient.defaults.baseURL ?? "", "");
    const elapsed = Math.round(performance.now() - (startedAt.get(config) ?? performance.now()));
    return `[api] ${(config.method ?? "get").toUpperCase()} ${url} → ${outcome} in ${elapsed}ms`;
  };

  serverClient.interceptors.request.use((config) => {
    startedAt.set(config, performance.now());
    return config;
  });
  serverClient.interceptors.response.use(
    (response) => {
      console.info(describe(response.config, response.status));
      return response;
    },
    (error: unknown) => {
      if (isAxiosError(error) && error.config) {
        const status = error.response?.status ?? `no response (${error.code})`;
        const requestId = String(error.config.headers["X-Request-Id"]);
        console.warn(`${describe(error.config, status)}, request ${requestId}`);
        if (error.response) console.warn(JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    },
  );
}

serverClient.interceptors.response.use(undefined, (error: unknown) => {
  throw toApiError(error);
});

/** Pause before the one retry of a read that never reached the API */
const RETRY_DELAY_MS = 500;

/**
 * The request function for the public reads (films and showtimes) that Server Components cache.
 * It never sends credentials, so nothing a member alone may see can reach the shared server
 * cache. Resolves like http.ts: `data`, or `{ items, meta }` for a list.
 *
 * A read that never reached the API (DNS, a refused or dropped connection, a timeout, a gateway's
 * own error page) is tried once more, so a short blip isn't cached as an outage. Only reads come
 * through here, so a retry can never repeat a booking or a payment.
 */
export async function httpServer(config: AxiosRequestConfig): Promise<unknown> {
  const request = () => serverClient.request<unknown>({ ...config, withCredentials: false });
  try {
    return unwrapEnvelope((await request()).data);
  } catch (error) {
    if (!isApiError(error) || !error.is(ErrorCode.NETWORK_ERROR)) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return unwrapEnvelope((await request()).data);
  }
}
