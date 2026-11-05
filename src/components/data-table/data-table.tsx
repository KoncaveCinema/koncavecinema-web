// Client code without its own "use client": columns are render functions, so only client modules
// (already the boundary) import it, and its props never cross from the server.

import { cn } from "cn";
import { FilterX } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { EmptyState, ErrorState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pagination } from "@/hooks/use-pagination";
import type { PaginationMeta } from "@/lib/api";

import { DataTablePagination } from "./data-table-pagination";

export interface Column<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Numbers and money line up on the right */
  align?: "start" | "end";
  className?: string;
  /** Hidden from the phone card (the card already shows it, or it is secondary) */
  hideOnMobile?: boolean;
}

/**
 * Records in a table from `md` up (scannable, keyboard friendly), stacked cards on phones. The
 * API pages, filters and sorts every list, so the table only draws the rows it is given.
 *
 * It owns the states every list has: skeleton rows in the real columns while loading, an error
 * with a retry, and two kinds of empty: nothing yet (what goes here, how to add it), or nothing
 * matching the filters (with a way to clear them). With `pagination`, the page controls sit
 * under the rows.
 *
 * With `rowHref`, the first column's text becomes a link stretched over the whole row, so a row
 * opens its record by click, tap or keyboard, without nesting interactive elements.
 */
export function DataTable<Row>({
  rows,
  columns,
  rowKey,
  rowHref,
  isLoading = false,
  error,
  onRetry,
  empty,
  filtered,
  pagination,
  caption,
  loadingRows = 6,
  className,
}: {
  rows: Row[] | undefined;
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  rowHref?: (row: Row) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Nothing here yet */
  empty: ComponentProps<typeof EmptyState>;
  /** Set while a search or filter narrows the list: an empty result then offers to clear it */
  filtered?: { onClear: () => void; title?: string; hint?: ReactNode };
  pagination?: { meta: PaginationMeta | undefined; state: Pagination };
  /** For screen readers: what the table lists */
  caption: string;
  loadingRows?: number;
  className?: string;
}) {
  const footer = pagination?.meta && (
    <DataTablePagination meta={pagination.meta} pagination={pagination.state} />
  );

  if (error && !rows?.length) {
    return <ErrorState onRetry={onRetry} className={className} />;
  }
  if (isLoading && !rows) {
    return <LoadingRows columns={columns} count={loadingRows} className={className} />;
  }
  if (!rows?.length) {
    return filtered ? (
      <EmptyState
        icon={FilterX}
        title={filtered.title ?? "Nothing matches these filters"}
        hint={filtered.hint ?? "Try a different search, or clear the filters to see everything."}
        action={
          <Button variant="outline" onClick={filtered.onClear}>
            Clear filters
          </Button>
        }
        className={className}
      />
    ) : (
      <EmptyState {...empty} className={className} />
    );
  }

  const [first, ...rest] = columns;
  const firstCell = (row: Row) => {
    const content = first!.cell(row);
    const href = rowHref?.(row);
    return href ? (
      <Link
        href={href}
        className="outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
      >
        {content}
      </Link>
    ) : (
      content
    );
  };

  return (
    <div className={className}>
      {/* Phones: one card per record */}
      <ul className="divide-y divide-white/8 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn("relative px-4 py-4", rowHref && "transition-colors hover:bg-white/3")}
          >
            <div className="text-sm font-medium">{firstCell(row)}</div>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
              {rest
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.id} className="min-w-0">
                    <dt className="text-[0.7rem] text-white/40">{column.header}</dt>
                    <dd className="mt-0.5 truncate text-sm">{column.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Tablets and up: a real table */}
      <div className="hidden md:block">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <HeaderRow columns={columns} />
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={cn(
                  "relative border-white/6",
                  rowHref ? "hover:bg-white/3" : "hover:bg-white/2",
                )}
              >
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      cellClass(column),
                      "h-12 whitespace-normal",
                      index === 0 && "font-medium",
                      column.align === "end" && "tabular-nums",
                    )}
                  >
                    {index === 0 ? firstCell(row) : column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {footer}
    </div>
  );
}

/** Shared by the header and the cells, so every column lines up with its heading */
function cellClass(column: { align?: "start" | "end"; className?: string }) {
  return cn("px-4 first:pl-5 last:pr-5", column.align === "end" && "text-right", column.className);
}

function HeaderRow<Row>({ columns }: { columns: Column<Row>[] }) {
  return (
    <TableRow className="border-white/8 hover:bg-transparent">
      {columns.map((column) => (
        <TableHead
          key={column.id}
          scope="col"
          className={cn(cellClass(column), "text-xs text-white/45")}
        >
          {column.header}
        </TableHead>
      ))}
    </TableRow>
  );
}

/** Skeleton rows shaped like the real ones: the real headings, a bar in every cell */
function LoadingRows<Row>({
  columns,
  count,
  className,
}: {
  columns: Column<Row>[];
  count: number;
  className?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      <ul className="divide-y divide-white/8 md:hidden">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="space-y-3 px-4 py-4">
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-3" />
              <Skeleton className="h-3" />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <HeaderRow columns={columns} />
          </TableHeader>
          <TableBody>
            {Array.from({ length: count }, (_, index) => (
              <TableRow key={index} className="border-white/6 hover:bg-transparent">
                {columns.map((column, cell) => (
                  <TableCell key={column.id} className={cn(cellClass(column), "h-12")}>
                    <Skeleton
                      className={cn(
                        "h-3.5",
                        cell === 0 ? "w-3/4" : "w-1/2",
                        column.align === "end" && "ml-auto",
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
