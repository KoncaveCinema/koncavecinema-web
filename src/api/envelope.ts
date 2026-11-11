import type { ApiEnvelope } from "./types";

/**
 * What a request resolves to: the envelope's `data`, or `{ items, meta }` for a paginated list
 * (the shape DataTable takes). An empty body (204) resolves to undefined.
 */
export function unwrapEnvelope(body: unknown): unknown {
  if (typeof body !== "object" || body === null || !("data" in body)) return undefined;
  const { data, meta } = body as ApiEnvelope<unknown>;
  return meta ? { items: data, meta } : data;
}
