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
import { PAGE_SIZES, type PageSize, type Pagination } from "@/hooks/use-pagination";
import type { PaginationMeta } from "@/lib/api";

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
    <nav
      aria-label="Pages"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/8 px-4 py-3 text-xs text-white/50 sm:px-5",
        className,
      )}
    >
      <p className="tabular-nums">
        Showing {from}-{to} of {meta.total}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2.5">
          <span>Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => pagination.setPageSize(Number(value) as PageSize)}
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
          <p className="tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-1.5">
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
          </div>
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
