"use client";

import { parseAsArrayOf, parseAsNumberLiteral, parseAsString, useQueryStates } from "nuqs";

import { PAGE_SIZES, type PageSize } from "./use-pagination";

/*
 * Paging on an API cursor, for lists too large to count (the audit log). There is no total and
 * no "page 7 of 120": the API hands back where the next page starts, and the address keeps the
 * cursors that led here (`?after=`), so Previous, a reload and a shared link all work. The page
 * size is the same choice as everywhere else (`?pageSize=`).
 */

export interface CursorPagination {
  /** 1 on the newest page */
  pageIndex: number;
  pageSize: PageSize;
  /** Spread into the API query: where this page starts, and how many rows */
  query: { cursor: string | undefined; limit: PageSize };
  /** On to the page that starts at the API's `nextCursor` */
  next: (nextCursor: string) => void;
  previous: () => void;
  /** Back to the newest entries */
  first: () => void;
  /** A new size starts again from the newest */
  setPageSize: (pageSize: PageSize) => void;
}

export function useCursorPagination(defaultPageSize: PageSize): CursorPagination {
  const [state, setState] = useQueryStates({
    after: parseAsArrayOf(parseAsString).withDefault([]),
    pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(defaultPageSize),
  });
  const { after, pageSize } = state;
  const trail = (next: string[]) => (next.length > 0 ? next : null);

  return {
    pageIndex: after.length + 1,
    pageSize,
    query: { cursor: after.at(-1), limit: pageSize },
    next: (nextCursor) => void setState({ after: [...after, nextCursor] }),
    previous: () => void setState({ after: trail(after.slice(0, -1)) }),
    first: () => void setState({ after: null }),
    setPageSize: (next) =>
      void setState({ pageSize: next === defaultPageSize ? null : next, after: null }),
  };
}
