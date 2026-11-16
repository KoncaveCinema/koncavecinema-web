import { environmentManager, MutationCache, QueryClient, type Query } from "@tanstack/react-query";
import { toast } from "sonner";

import { refreshCatalog } from "./catalog-actions";
import { isApiError } from "./errors";
import { matchesPrefixes, refetchAfter, refreshesCatalog } from "./refetch";

function makeQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    // After a mutation succeeds, refetch what it changed (refetch.ts), found by its key: its
    // operation name. It waits only for the changed queries on screen; a failure there says so.
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const [operation] = mutation.options.mutationKey ?? [];
        if (typeof operation === "string" && refreshesCatalog.has(operation)) {
          // The public pages too; a failure only leaves them on the cache's few minutes
          void refreshCatalog().catch(() => {});
        }
        const prefixes = typeof operation === "string" ? refetchAfter[operation] : undefined;
        if (!prefixes?.length) return;
        const changed = (query: Query) => matchesPrefixes(query.queryKey, prefixes);
        const onScreen = (query: Query) => changed(query) && query.meta?.background !== true;
        // Everything changed goes stale: what isn't shown reloads when it next is
        void queryClient.invalidateQueries({ predicate: changed, refetchType: "none" });
        // Background queries (the sidebar's badge) catch up without holding the write
        void queryClient.refetchQueries({
          predicate: (query) => changed(query) && !onScreen(query),
          type: "active",
        });
        // The write finishes once the screen shows it, so its toast and the change land together
        const refresh = () =>
          queryClient.refetchQueries(
            { predicate: onScreen, type: "active" },
            { throwOnError: true },
          );
        return refresh().catch((error: unknown) => {
          // Not found: the write removed what the page showed (a deleted draft), not a failure
          if (isApiError(error) && error.status === 404) return;
          toast.error("Saved, but this page couldn't refresh.", {
            action: { label: "Refresh", onClick: () => void refresh().catch(() => {}) },
          });
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
