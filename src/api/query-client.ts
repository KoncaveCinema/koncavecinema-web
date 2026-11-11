import { environmentManager, MutationCache, QueryClient } from "@tanstack/react-query";

import { isApiError } from "./errors";
import { matchesPrefixes, refetchAfter } from "./refetch";

function makeQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    // After a mutation succeeds, refetch what it changed (refetch.ts), found by its key: its
    // operation name. Mutations of the modules not yet moved have none and refresh themselves.
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const [operation] = mutation.options.mutationKey ?? [];
        const prefixes = typeof operation === "string" ? refetchAfter[operation] : undefined;
        if (!prefixes?.length) return;
        return queryClient.invalidateQueries({
          predicate: (query) => matchesPrefixes(query.queryKey, prefixes),
        });
      },
    }),
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
  return queryClient;
}

let browserQueryClient: QueryClient | undefined;

/** A new client per server request; one shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
