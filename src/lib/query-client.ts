import { environmentManager, QueryClient } from "@tanstack/react-query";

import { isApiError } from "@/lib/api/errors";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data rendered on the server is not refetched immediately after hydration
        staleTime: 60_000,
        // Retry network failures and 5xx; a 4xx will not change on retry
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Writes are retried deliberately by the caller (with an idempotency key), never blindly
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** A new client per server request; one shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
