"use client";

import { CalendarPlus, CalendarX2 } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";

import { DataTable, type Column } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { UrlTabs, useTabParam } from "@/components/console/url-controls";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker, SearchSelect, filmOptions } from "@/components/console/pickers";
import { formatLagosDateTime, formatMoney } from "@/lib/format";

import { PosterThumb } from "../films/poster-thumb";
import { useFilms } from "../films/queries";
import type { AdminShowtimeListItem, ShowtimeFilter } from "./api-types";
import { useShowtimes } from "./queries";
import { ShowtimeDialog } from "./showtime-dialog";

const STATES = ["upcoming", "live", "past", "cancelled"] as const;
const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
] as const;
// The API's limit on a date range for this list
const MAX_SPAN_DAYS = 31;
const DAY = 24 * 60 * 60_000;

const COLUMNS: Column<AdminShowtimeListItem>[] = [
  {
    id: "film",
    header: "Film",
    cell: (showtime) => (
      <span className="flex items-center gap-3">
        <PosterThumb src={showtime.movie.posterPortrait || null} />
        <span className="truncate font-semibold">{showtime.movie.title}</span>
      </span>
    ),
  },
  {
    id: "start",
    header: "Starts",
    cell: (showtime) => (
      <span className="whitespace-nowrap">{formatLagosDateTime(showtime.startTime)}</span>
    ),
  },
  {
    id: "state",
    header: "State",
    cell: (showtime) => <StatusBadge kind="showtime" status={showtime.state} />,
  },
  {
    id: "price",
    header: "Base price",
    align: "end",
    cell: (showtime) => formatMoney(showtime.basePrice, showtime.currency),
  },
  { id: "sold", header: "Sold", align: "end", cell: (showtime) => showtime.ticketsSold },
  {
    id: "holds",
    header: "On hold",
    align: "end",
    hideOnMobile: true,
    cell: (showtime) => showtime.activeHolds,
  },
];

/** /admin/showtimes: every screening, filtered by film, Lagos days and state, all in the URL. */
export function ShowtimesPage() {
  const [status] = useTabParam("status", STATES, "upcoming");
  const pagination = usePagination();
  const [filters, setFilters] = useQueryStates({
    film: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });
  const [adding, setAdding] = useState(false);
  const films = useFilms({});

  const span =
    filters.from && filters.to ? (Date.parse(filters.to) - Date.parse(filters.from)) / DAY : 0;
  const rangeProblem =
    span < 0
      ? "The end day is before the start day."
      : span >= MAX_SPAN_DAYS
        ? `Choose at most ${MAX_SPAN_DAYS} days at a time.`
        : null;

  const showtimes = useShowtimes({
    status: status as ShowtimeFilter,
    movieId: filters.film || undefined,
    from: rangeProblem ? undefined : filters.from || undefined,
    to: rangeProblem ? undefined : filters.to || undefined,
    ...pagination.query,
  });
  const filtered = Boolean(filters.film || filters.from || filters.to);

  const setFilter = (next: Partial<typeof filters>) => {
    void setFilters(
      Object.fromEntries(Object.entries(next).map(([key, value]) => [key, value || null])),
    );
    pagination.resetPage();
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Showtimes"
        description="Every screening, with what's sold and on hold. Days and times are Lagos time."
        actions={
          <Button onClick={() => setAdding(true)}>
            <CalendarPlus data-icon="inline-start" />
            Add showtime
          </Button>
        }
      />
      <Panel flush>
        <UrlTabs param="status" tabs={TABS} fallback="upcoming" label="Showtime state" />
        <div className="grid gap-3 border-b border-white/8 p-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <SearchSelect
            label="Film"
            value={filters.film}
            onChange={(film) => setFilter({ film })}
            options={filmOptions(films.data?.items)}
            anyLabel="All films"
            searchPlaceholder="Search films"
            emptyText="No film by that name."
            className="h-10 rounded-full"
          />
          <DatePicker
            label="From (Lagos day)"
            placeholder="From"
            value={filters.from}
            onChange={(from) => setFilter({ from })}
            className="h-10 rounded-full"
          />
          <DatePicker
            label="To (Lagos day)"
            placeholder="To"
            value={filters.to}
            onChange={(to) => setFilter({ to })}
            disabled={filters.from ? { before: new Date(`${filters.from}T00:00`) } : undefined}
            className="h-10 rounded-full"
          />
          {rangeProblem && (
            <p role="alert" className="text-xs text-destructive sm:col-span-3">
              {rangeProblem}
            </p>
          )}
        </div>
        <DataTable
          rows={showtimes.data?.items}
          columns={COLUMNS}
          rowKey={(showtime) => showtime.id}
          rowHref={(showtime) => `/admin/showtimes/${showtime.id}`}
          isLoading={showtimes.isPending || showtimes.isPlaceholderData}
          error={showtimes.error}
          onRetry={() => void showtimes.refetch()}
          caption="Showtimes"
          empty={{
            icon: CalendarX2,
            title: `No ${status} showtimes`,
            hint: status === "upcoming" ? "Add a showtime to put a film on sale." : undefined,
          }}
          filtered={
            filtered
              ? {
                  title: `No ${status} showtimes match`,
                  hint: "Try another film or other days, or clear the filters.",
                  onClear: () => setFilter({ film: "", from: "", to: "" }),
                }
              : undefined
          }
          pagination={{ meta: showtimes.data?.meta, state: pagination }}
        />
      </Panel>
      <ShowtimeDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
