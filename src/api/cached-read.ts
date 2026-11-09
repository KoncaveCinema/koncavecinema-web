import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

/*
 * The rule for every public read cached with "use cache" (films and showtimes): shared between
 * visitors and refreshed about every minute. A failure, an outage or a reply that fails its schema,
 * is caught inside the cache (an error thrown from a cached function during `next build` fails the
 * export even when the caller catches it), logged, and retried after 10 seconds.
 */

/**
 * Cache lifetime for a failed load: retried in the background after 10 seconds, and kept by the
 * browser for 30 seconds (Next's minimum) so a page doesn't stay broken after the API recovers.
 * The expiry stays at the 5-minute minimum so the result can still be prerendered rather than
 * becoming dynamic.
 */
const FAILURE_LIFE = { stale: 30, revalidate: 10, expire: 300 };

/** Call inside a "use cache" function. Null means unavailable: pages show their empty states. */
export async function cachedRead<T>(label: string, load: () => Promise<T>): Promise<T | null> {
  try {
    const result = await load();
    cacheLife("minutes");
    return result;
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    // A schema mismatch lists each wrong field with its path, e.g. items[2].priceFrom.amount
    const reason =
      error instanceof z.ZodError
        ? `the reply doesn't match its schema\n${z.prettifyError(error)}`
        : error instanceof Error
          ? error.message
          : error;
    console.error(`${label} unavailable:`, reason);
    return null;
  }
}
