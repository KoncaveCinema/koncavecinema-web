import type { AxiosRequestConfig } from "axios";

import { whenSessionRestored } from "./access-token";
import { apiClient } from "./client";
import { unwrapEnvelope } from "./envelope";

/*
 * The request function each module's calls go through. It sends through the one axios client,
 * so the in-memory token, the shared refresh on a 401, the request id, the server clock and
 * ApiError all apply, and it resolves to the envelope's contents: `data`, or `{ items, meta }`
 * for a paginated list. The module then parses that with its Zod schema.
 */

// Calls that never need a session, so they don't wait for the start-up refresh
const SESSIONLESS_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export async function http(config: AxiosRequestConfig): Promise<unknown> {
  const sessionless = SESSIONLESS_PATHS.some((path) => config.url?.startsWith(path));
  if (!sessionless && typeof window !== "undefined") await whenSessionRestored();
  const response = await apiClient.request<unknown>(config);
  return unwrapEnvelope(response.data);
}
