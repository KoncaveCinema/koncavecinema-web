// Client code without its own "use client": columns are render functions, so only client modules
// (already the boundary) import it, and its props never cross from the server.

import { cn } from "cn";
import { ChevronRight, FilterX } from "lucide-react";
import Link from "next/link";
import { Fragment, useState, type ComponentProps, type ReactNode } from "react";

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
import type { CursorPagination } from "@/hooks/use-cursor-pagination";
import type { Pagination } from "@/hooks/use-pagination";
import type { PaginationMeta } from "@/lib/api";

import { DataTableCursorPagination, DataTablePagination } from "./data-table-pagination";

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
 * opens its record by click, tap or keyboard, without nesting interactive elements. With
 * `expanded`, a row with more to show gets a chevron that opens it beneath the row.
 *
 * Pagination is by page number (the API's `meta`) or, for lists too large to count, by cursor.
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
  expanded,
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
  pagination?:
    | { meta: PaginationMeta | undefined; state: Pagination }
    | {
        cursor: { count: number; nextCursor: string | null } | undefined;
        state: CursorPagination;
      };
  /** More about a row, opened beneath it; null for a row with nothing more */
  expanded?: (row: Row) => ReactNode | null;
  /** For screen readers: what the table lists */
  caption: string;
  loadingRows?: number;
  className?: string;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const footer =
    pagination &&
    ("meta" in pagination
      ? pagination.meta && (
          <DataTablePagination meta={pagination.meta} pagination={pagination.state} />
        )
      : pagination.cursor && (
          <DataTableCursorPagination
            count={pagination.cursor.count}
            nextCursor={pagination.cursor.nextCursor}
            pagination={pagination.state}
          />
        ));

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

  /** The chevron that opens a row; the same on the card and in the table */
  const opener = (key: string) => (
    <button
      type="button"
      aria-expanded={open.has(key)}
      aria-controls={`more-${key}`}
      aria-label={open.has(key) ? "Hide details" : "Show details"}
      onClick={() => toggle(key)}
      className="grid size-7 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/6 hover:text-foreground"
    >
      <ChevronRight
        aria-hidden="true"
        className={cn("size-4 transition-transform", open.has(key) && "rotate-90")}
      />
    </button>
  );
  const moreClass = "overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-white/70";

  return (
    <div className={className}>
      {/* Phones: one card per record */}
      <ul className="divide-y divide-white/8 md:hidden">
        {rows.map((row) => {
          const key = rowKey(row);
          const more = expanded?.(row);
          return (
            <li
              key={key}
              className={cn("relative px-4 py-4", rowHref && "transition-colors hover:bg-white/3")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm font-medium">{firstCell(row)}</div>
                {more && opener(key)}
              </div>
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
              {more && open.has(key) && (
                <div id={`more-${key}`} className={cn(moreClass, "mt-3")}>
                  {more}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tablets and up: a real table */}
      <div className="hidden md:block">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <HeaderRow columns={columns} opener={Boolean(expanded)} />
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const key = rowKey(row);
              const more = expanded?.(row);
              return (
                <Fragment key={key}>
                  <TableRow
                    className={cn(
                      "relative border-white/6",
                      rowHref ? "hover:bg-white/3" : "hover:bg-white/2",
                      more && open.has(key) && "border-b-0",
                    )}
                  >
                    {expanded && (
                      <TableCell className="w-10 pr-0 pl-3">{more && opener(key)}</TableCell>
                    )}
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
                  {more && open.has(key) && (
                    <TableRow className="border-white/6 hover:bg-transparent">
                      <TableCell colSpan={columns.length + 1} className="px-5 pt-0 pb-4">
                        <div id={`more-${key}`} className={moreClass}>
                          {more}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
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

function HeaderRow<Row>({
  columns,
  opener = false,
}: {
  columns: Column<Row>[];
  /** A narrow first column for the rows' chevrons */
  opener?: boolean;
}) {
  return (
    <TableRow className="border-white/8 hover:bg-transparent">
      {opener && (
        <TableHead className="w-10 pr-0 pl-3">
          <span className="sr-only">Details</span>
        </TableHead>
      )}
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
