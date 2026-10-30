// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsInteger, parseAsStringLiteral, useQueryState, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/api";

/*
 * Tabs and pages live in the address, so a list survives a reload, the back button and a
 * shared link. Changing tab returns to page 1.
 */

const pageParser = parseAsInteger.withDefault(1);

/** The current page of a paginated list (`?page=`, 1 when absent). */
export function usePageParam() {
  return useQueryState("page", pageParser);
}

/** A tab in the address, e.g. `?when=past`, limited to the tabs that exist. */
export function useTabParam<T extends string>(param: string, values: readonly T[], fallback: T) {
  return useQueryState(param, parseAsStringLiteral(values).withDefault(fallback));
}

/**
 * Tabs that switch a list's view (Upcoming / Past, Pending / Done). Links in the address, so the
 * view is shareable; the page reads the same parameter with `useTabParam`.
 */
export function UrlTabs<T extends string>({
  param,
  tabs,
  fallback,
  label,
  className,
}: {
  param: string;
  tabs: readonly { value: T; label: string; count?: number }[];
  fallback: T;
  label: string;
  className?: string;
}) {
  const [state, setState] = useQueryStates({
    [param]: parseAsStringLiteral(tabs.map((tab) => tab.value)).withDefault(fallback),
    page: parseAsInteger,
  });
  const current = state[param];
  return (
    <div
      role="tablist"
      aria-label={label}
      // Scrolls sideways on narrow screens only; the underline sits on the border, never
      // creating a vertical scroll
      className={cn(
        "flex [scrollbar-width:none] gap-1 overflow-x-auto overflow-y-hidden border-b border-white/8 px-2",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() =>
              void setState({ [param]: tab.value === fallback ? null : tab.value, page: null })
            }
            className={cn(
              "relative flex h-11 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "text-foreground" : "text-white/50 hover:text-foreground",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full",
              active && "after:bg-brand",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[0.7rem] tabular-nums",
                  active ? "bg-white/10 text-foreground" : "bg-white/5 text-white/45",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Previous / next through a paginated list, with where you are. */
export function Pager({ meta, className }: { meta: PaginationMeta; className?: string }) {
  const [, setPage] = usePageParam();
  if (meta.totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pages"
      className={cn(
        "flex items-center justify-between gap-4 border-t border-white/8 px-5 py-3 text-xs text-white/50",
        className,
      )}
    >
      <p className="tabular-nums">
        Page {meta.page} of {meta.totalPages} · {meta.total} in all
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPreviousPage}
          onClick={() => void setPage(meta.previousPage === 1 ? null : meta.previousPage)}
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => void setPage(meta.nextPage)}
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
