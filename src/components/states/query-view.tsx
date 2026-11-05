// Client code without its own "use client": it takes a render function, so only client modules
// (already the boundary) import it, and its props never cross from the server.

import { SearchX } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { ErrorCode, toApiError } from "@/lib/api";

import { EmptyState, ErrorState } from "./states";

/** What a TanStack Query result needs to give for one record's page */
export interface QueryLike<T> {
  data: T | undefined;
  error: unknown;
  isPending: boolean;
  refetch: () => unknown;
}

/**
 * One record's page in its four states, written once: the skeleton while it loads, "can't find"
 * when the API answers NOT_FOUND or FORBIDDEN (someone else's record looks the same as none, as
 * the API intends), the error with a retry otherwise, and the content with its data typed.
 * Data already on screen stays when a later refetch fails.
 */
export function QueryView<T>({
  query,
  loading,
  notFound,
  errorTitle,
  frame = (state) => state,
  children,
}: {
  query: QueryLike<T>;
  loading: ReactNode;
  /** The "can't find" state; without it, a missing record is an error like any other */
  notFound?: Omit<ComponentProps<typeof EmptyState>, "icon"> & {
    icon?: ComponentProps<typeof EmptyState>["icon"];
  };
  errorTitle?: string;
  /** Where the not-found and error states sit, e.g. under the page's header, in a panel */
  frame?: (state: ReactNode) => ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.data !== undefined) return children(query.data);
  if (query.error) {
    if (notFound && toApiError(query.error).is(ErrorCode.NOT_FOUND, ErrorCode.FORBIDDEN)) {
      return frame(<EmptyState icon={SearchX} {...notFound} />);
    }
    return frame(<ErrorState title={errorTitle} onRetry={() => void query.refetch()} />);
  }
  return loading;
}
