// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { Search } from "lucide-react";
import {
  debounce,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";

import { usePagination } from "@/hooks/use-pagination";

/*
 * Tabs and pages live in the address, so a list survives a reload, the back button and a
 * shared link. Changing tab or search returns to page 1; the page itself is `usePagination`'s.
 */

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

const searchParser = parseAsString.withDefault("");

/** A list's search text in the address (`?q=`). Typing waits a moment before the list asks. */
export function useSearchParam(param = "q") {
  return useQueryState(param, searchParser);
}

/** A search box bound to the address; a new search returns to page 1. */
export function UrlSearch({
  param = "q",
  label,
  placeholder,
  className,
}: {
  param?: string;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useSearchParam(param);
  const { resetPage } = usePagination();
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40"
      />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          void setValue(next || null, { limitUrlUpdates: next ? debounce(350) : undefined });
          resetPage();
        }}
        className="h-10 w-full rounded-full border border-white/10 bg-white/4 pr-4 pl-10 text-sm outline-none placeholder:text-white/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />
    </label>
  );
}
