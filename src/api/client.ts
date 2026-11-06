import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/env";

import { getAccessToken, setAccessToken } from "./access-token";
import { toApiError } from "./errors";
import { recordServerTime } from "./server-clock";
import type { ApiEnvelope, Paginated } from "./types";

/**
 * The one HTTP client for koncavecinema-api (browser and Server Components).
 *
 * - Sends credentials so the API's HttpOnly refresh cookie travels with /auth requests.
 * - Attaches the in-memory access token and a fresh X-Request-Id to every request.
 * - On a 401, refreshes the access token once (concurrent requests and open tabs share the
 *   same refresh) and retries the original request a single time.
 * - Rejects with ApiError; branch on `error.code`.
 */

// Endpoints whose 401 means "wrong credentials" or "no session", never "token expired"
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set("X-Request-Id", config.headers.get("X-Request-Id") ?? newRequestId());
  // Browser only: on the server this module is shared by every visitor (use ./server.ts there)
  const token = typeof window === "undefined" ? null : getAccessToken();
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Every envelope carries the server time: keep the device clock's offset from it
apiClient.interceptors.response.use((response) => {
  const body = response.data as { timestamp?: string } | undefined;
  recordServerTime(body?.timestamp);
  return response;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) throw toApiError(error);

  const config = error.config as RetriableConfig;
  const isAuthPath = NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path));

  if (error.response?.status === 401 && !config._retried && !isAuthPath) {
    config._retried = true;
    const token = await refreshAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
      config.headers.set("X-Request-Id", newRequestId());
      return apiClient(config);
    }
  }

  throw toApiError(error);
});

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. The API rotates the refresh token on every
 * use and ends every session of the account when a replaced one comes back, so none may be sent
 * twice: requests in this tab share one refresh, and tabs take turns (see oneTabAtATime), each
 * sending the cookie the previous refresh set.
 *
 * Resolves to null when there is no new token. A 401 (no cookie, expired, already used) ends the
 * session; a network or server failure keeps it, and only the request that needed it fails. It
 * never retries: one refresh per 401, and the caller decides what happens next.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= oneTabAtATime(requestRefresh).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function requestRefresh(): Promise<string | null> {
  try {
    const response = await axios.post<ApiEnvelope<{ accessToken: string; expiresIn: number }>>(
      "/auth/refresh",
      undefined,
      {
        baseURL: env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        timeout: 15_000,
        headers: { "X-Request-Id": newRequestId() },
      },
    );
    setAccessToken(response.data.data.accessToken);
    return response.data.data.accessToken;
  } catch (error) {
    const ended = axios.isAxiosError(error) && error.response?.status === 401;
    // Without a token yet (the start-up restore) this also releases the requests waiting on it
    if (ended || getAccessToken() === null) setAccessToken(null);
    return null;
  }
}

/**
 * Runs the refresh under a lock shared by every tab of this site (Web Locks API), so two tabs
 * never send the same refresh cookie. Browsers without it run the refresh straight away.
 */
async function oneTabAtATime<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) return task();
  return navigator.locks.request("koncave-refresh", task);
}

/** Calls an endpoint and returns the envelope's `data`. */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return response.data.data;
}

/** Calls a paginated list endpoint and returns its items with the pagination meta. */
async function requestPage<T>(config: AxiosRequestConfig): Promise<Paginated<T>> {
  const response = await apiClient.request<ApiEnvelope<T[]>>(config);
  const { data, meta } = response.data;
  if (!meta) throw new Error(`Expected a paginated response from ${config.url}`);
  return { items: data, meta };
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url }),
  getPage: <T>(url: string, config?: AxiosRequestConfig) =>
    requestPage<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
};

/**
 * A key for one intended operation (reserve a pass, start a checkout). Create it when the user
 * starts the action and send the same key on every retry of it, so the API never reserves or
 * charges twice.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function withIdempotencyKey(key: string): AxiosRequestConfig {
  return { headers: { "Idempotency-Key": key } };
}

function newRequestId(): string {
  return `web-${crypto.randomUUID()}`;
}
