// Client code without its own "use client": only client modules import it (see data-table.tsx).

import { cn } from "cn";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CursorPagination } from "@/hooks/use-cursor-pagination";
import { PAGE_SIZES, type PageSize, type Pagination } from "@/hooks/use-pagination";
import type { PaginationMeta } from "@/api";

/**
 * Under a paginated list: how many rows a page shows, which ones these are, and the way through
 * the pages. The numbers are the API's `meta`; the page and size are the address's (through
 * `usePagination`). Hidden while everything fits on one page at the smallest size, where there
 * is nothing to choose.
 */
export function DataTablePagination({
  meta,
  pagination,
  className,
}: {
  meta: PaginationMeta;
  pagination: Pagination;
  className?: string;
}) {
  if (meta.total <= PAGE_SIZES[0]) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <Footer
      className={className}
      showing={`Showing ${from}-${to} of ${meta.total}`}
      pageSize={pagination.pageSize}
      onPageSize={pagination.setPageSize}
      where={`Page ${meta.page} of ${meta.totalPages}`}
    >
      <PageButton
        label="First page"
        disabled={!meta.hasPreviousPage}
        onClick={() => pagination.setPage(1)}
      >
        <ChevronsLeft />
      </PageButton>
      <PageButton
        label="Previous page"
        disabled={!meta.hasPreviousPage}
        onClick={() => pagination.setPage(meta.previousPage ?? 1)}
      >
        <ChevronLeft />
      </PageButton>
      <PageButton
        label="Next page"
        disabled={!meta.hasNextPage}
        onClick={() => pagination.setPage(meta.nextPage ?? meta.totalPages)}
      >
        <ChevronRight />
      </PageButton>
      <PageButton
        label="Last page"
        disabled={!meta.hasNextPage}
        onClick={() => pagination.setPage(meta.totalPages)}
      >
        <ChevronsRight />
      </PageButton>
    </Footer>
  );
}

/**
 * The same footer for a list paged on a cursor (too large to count): which rows these are and
 * the way back and on, without a total or a last page. Hidden while the newest page holds
 * everything at the smallest size.
 */
export function DataTableCursorPagination({
  count,
  nextCursor,
  pagination,
  className,
}: {
  /** Rows on this page */
  count: number;
  /** The API's `nextCursor`: where the next page starts, or null on the last one */
  nextCursor: string | null;
  pagination: CursorPagination;
  className?: string;
}) {
  const { pageIndex, pageSize } = pagination;
  if (pageIndex === 1 && !nextCursor && count <= PAGE_SIZES[0]) return null;

  const from = (pageIndex - 1) * pageSize + 1;

  return (
    <Footer
      className={className}
      showing={count > 0 ? `Showing ${from}-${from + count - 1}` : "Nothing further"}
      pageSize={pageSize}
      onPageSize={pagination.setPageSize}
      where={`Page ${pageIndex}`}
    >
      <PageButton label="Newest" disabled={pageIndex === 1} onClick={pagination.first}>
        <ChevronsLeft />
      </PageButton>
      <PageButton label="Previous page" disabled={pageIndex === 1} onClick={pagination.previous}>
        <ChevronLeft />
      </PageButton>
      <PageButton
        label="Next page"
        disabled={!nextCursor}
        onClick={() => nextCursor && pagination.next(nextCursor)}
      >
        <ChevronRight />
      </PageButton>
    </Footer>
  );
}

/** The frame both footers share: what's shown, the rows-per-page choice, and the buttons */
function Footer({
  showing,
  where,
  pageSize,
  onPageSize,
  className,
  children,
}: {
  showing: string;
  where: string;
  pageSize: PageSize;
  onPageSize: (size: PageSize) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label="Pages"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/8 px-4 py-3 text-xs text-white/50 sm:px-5",
        className,
      )}
    >
      <p className="tabular-nums">{showing}</p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2.5">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSize(Number(value) as PageSize)}
          >
            <SelectTrigger size="sm" className="w-18 rounded-full border-white/10 bg-white/4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-3">
          <p className="tabular-nums">{where}</p>
          <div className="flex gap-1.5">{children}</div>
        </div>
      </div>
    </nav>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
