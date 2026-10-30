import { cn } from "cn";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState, ErrorState } from "./states";

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
 * A list of records: a real table from `md` up (scannable, sortable by eye, keyboard friendly),
 * stacked cards on phones. Owns the three states every list has: loading (skeleton rows shaped
 * like the real ones), empty (what goes here and how to add it) and error (with a retry).
 *
 * With `rowHref`, the first column's text becomes a link stretched over the whole row, so a
 * row opens its record by click, tap or keyboard, without nesting interactive elements.
 */
export function DataList<Row>({
  rows,
  columns,
  rowKey,
  rowHref,
  isLoading = false,
  error,
  onRetry,
  empty,
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
  empty: ComponentProps<typeof EmptyState>;
  /** For screen readers: what the table lists */
  caption: string;
  loadingRows?: number;
  className?: string;
}) {
  if (error && !rows?.length) {
    return <ErrorState onRetry={onRetry} className={className} />;
  }
  if (isLoading && !rows) {
    return <LoadingRows columns={columns.length} count={loadingRows} className={className} />;
  }
  if (!rows?.length) {
    return <EmptyState {...empty} className={className} />;
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-white/8 text-left">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    "h-10 px-4 text-xs font-medium whitespace-nowrap text-white/45 first:pl-5 last:pr-5",
                    column.align === "end" && "text-right",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "relative transition-colors",
                  rowHref ? "hover:bg-white/3" : "hover:bg-white/2",
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={column.id}
                    className={cn(
                      "h-12 px-4 align-middle first:pl-5 last:pr-5",
                      index === 0 && "font-medium",
                      column.align === "end" && "text-right tabular-nums",
                      column.className,
                    )}
                  >
                    {index === 0 ? firstCell(row) : column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingRows({
  columns,
  count,
  className,
}: {
  columns: number;
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
        <div className="h-10 border-b border-white/8" />
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="grid h-12 items-center gap-6 border-b border-white/6 px-5"
            style={{ gridTemplateColumns: `2fr repeat(${Math.max(columns - 1, 0)}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, cell) => (
              <Skeleton key={cell} className={cn("h-3.5", cell === 0 ? "w-3/4" : "w-1/2")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
