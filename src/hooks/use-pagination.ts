"use client";

import { parseAsInteger, parseAsNumberLiteral, useQueryStates } from "nuqs";

/*
 * A paginated list's page and page size, kept in the address (`?page=`, `?pageSize=`) so a list
 * survives a reload, the back button and a shared link. The rules are the API's (its
 * docs/api/error-codes.md, section 2): `pageSize` defaults to 20 and is at most 100. The address
 * only takes the sizes on offer, so a hand-typed `?pageSize=500` falls back to the default.
 */

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
/** The API's own default, so a list without `?pageSize=` asks for what the API would send */
export const DEFAULT_PAGE_SIZE: PageSize = 20;

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(DEFAULT_PAGE_SIZE),
};

export interface Pagination {
  page: number;
  pageSize: PageSize;
  /** Spread into a list's API query */
  query: { page: number; pageSize: PageSize };
  setPage: (page: number) => void;
  /** A new size starts again from page 1 */
  setPageSize: (pageSize: PageSize) => void;
  /** Back to page 1, for a new search, filter or tab */
  resetPage: () => void;
}

export function usePagination(): Pagination {
  const [state, setState] = useQueryStates(paginationParsers);
  const page = Math.max(1, state.page);
  const { pageSize } = state;
  return {
    page,
    pageSize,
    query: { page, pageSize },
    // The defaults stay out of the address, so a plain list keeps a plain link
    setPage: (next) => void setState({ page: next <= 1 ? null : next }),
    setPageSize: (next) =>
      void setState({ pageSize: next === DEFAULT_PAGE_SIZE ? null : next, page: null }),
    resetPage: () => void setState({ page: null }),
  };
}
