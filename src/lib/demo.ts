import { env } from "@/env";
import { ApiError } from "@/lib/api";

/*
 * Demo mode (NEXT_PUBLIC_DATA_SOURCE=fixtures): services answer in the API's place with the same
 * shapes and error codes. Demo data lives in this browser tab's sessionStorage; it never holds a
 * token, and the live site never uses it.
 */

export const isDemo = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";

/** A short pause, so demo answers feel like a network round trip. */
export const demoDelay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

/** The API's error, as the demo throws it. */
export function demoError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError({ status, code, messages: [message], details });
}

/** Reads a demo value; storage may be blocked (private windows), so it falls back. */
export function readDemoStore<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Writes a demo value; null removes it. A blocked storage just forgets on reload. */
export function writeDemoStore(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the demo lasts until reload
  }
}
