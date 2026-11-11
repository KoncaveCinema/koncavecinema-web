"use client";

import { cn } from "cn";
import { BarChart3, ChevronRight, Download } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";

import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { EmptyState, ErrorState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { roomLabel } from "@/features/admin/rooms";
import { fieldClass } from "@/features/auth/form-parts";
import { useServerNow } from "@/hooks/use-now";
import { downloadFile } from "@/lib/download";
import { formatLagosDateTime, formatMoney } from "@/lib/format";

import { useFilms } from "../films/queries";
import type { SalesReport as Report, SalesTotals } from "./api-types";
import { useSalesReport } from "./queries";
import { SALES_PRESETS, TIERS, presetRange, rangeProblem, salesCsv } from "./sales";

function Figures({ totals, currency }: { totals: SalesTotals; currency: string }) {
  const rows = [
    { label: "Gateway fees", value: totals.gatewayFees },
    { label: "VAT", value: totals.vat },
    { label: "Producer share", value: totals.producerShare },
    { label: "Platform share", value: totals.platformShare },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-bold tracking-[0.2em] text-white/50 uppercase">
          Gross collected
        </p>
        <p className="mt-3 font-display text-4xl leading-none font-black tracking-tight tabular-nums">
          {formatMoney(totals.gross, currency)}
        </p>
        <p className="mt-2 text-xs text-white/45">
          {totals.payments.toLocaleString("en-NG")} {totals.payments === 1 ? "payment" : "payments"}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-white/45">{row.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(row.value, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ByRoom({ totals }: { totals: SalesTotals }) {
  const most = Math.max(1, ...TIERS.map((tier) => totals.ticketsByTier[tier] ?? 0));
  return (
    <ul className="space-y-3">
      {TIERS.map((tier) => {
        const count = totals.ticketsByTier[tier] ?? 0;
        return (
          <li
            key={tier}
            className="grid grid-cols-[9rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
          >
            <span className="text-white/70">{roomLabel(tier)}</span>
            <span className="h-2 overflow-hidden rounded-full bg-white/6" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-brand"
                style={{ width: `${(count / most) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}

const ROW =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_5rem_8rem_8rem_8rem]";

function ByFilm({ report }: { report: Report }) {
  const money = (value: number) => formatMoney(value, report.currency);
  return (
    <div className="text-sm">
      <div
        className={cn(
          ROW,
          "hidden border-b border-white/8 px-5 py-2.5 text-xs text-white/45 sm:grid",
        )}
      >
        <span>Film</span>
        <span className="text-right">Payments</span>
        <span className="text-right">Gross</span>
        <span className="text-right">Producer</span>
        <span className="text-right">Platform</span>
      </div>
      <ul className="divide-y divide-white/6">
        {report.movies.map((film) => (
          <li key={film.id}>
            <details className="group">
              <summary
                className={cn(
                  ROW,
                  "cursor-pointer list-none px-5 py-3.5 transition-colors hover:bg-white/3 [&::-webkit-details-marker]:hidden",
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-white/40 transition-transform group-open:rotate-90"
                  />
                  {film.title}
                </span>
                <span className="text-right tabular-nums sm:order-0">{film.payments}</span>
                <span className="col-span-2 pl-6 text-white/60 tabular-nums sm:col-span-1 sm:pl-0 sm:text-right sm:text-foreground">
                  <span className="sm:hidden">Gross </span>
                  {money(film.gross)}
                </span>
                <span className="hidden text-right tabular-nums sm:block">
                  {money(film.producerShare)}
                </span>
                <span className="hidden text-right tabular-nums sm:block">
                  {money(film.platformShare)}
                </span>
              </summary>
              <ul className="space-y-px bg-black/25 pb-2">
                {film.showtimes.map((showtime) => (
                  <li key={showtime.id} className={cn(ROW, "px-5 py-2.5 text-white/70")}>
                    <span className="pl-6">
                      {formatLagosDateTime(showtime.startTime)}
                      <span className="block text-xs text-white/40">
                        {TIERS.filter((tier) => showtime.ticketsByTier[tier])
                          .map(
                            (tier) =>
                              `${showtime.ticketsByTier[tier]} ${roomLabel(tier).toLowerCase()}`,
                          )
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="text-right tabular-nums">{showtime.payments}</span>
                    <span className="col-span-2 pl-6 tabular-nums sm:col-span-1 sm:pl-0 sm:text-right">
                      {money(showtime.gross)}
                    </span>
                    <span className="hidden text-right tabular-nums sm:block">
                      {money(showtime.producerShare)}
                    </span>
                    <span className="hidden text-right tabular-nums sm:block">
                      {money(showtime.platformShare)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** /admin/sales: kept revenue between two Lagos days, by room and by film, with a CSV export. */
export function SalesPage() {
  const now = useServerNow();
  const [range, setRange] = useQueryStates({
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    film: parseAsString.withDefault(""),
  });
  const films = useFilms({});
  // No days in the address: the last 30, once the clock is known
  const fallback = now === null ? null : presetRange("30d", now);
  const from = range.from || fallback?.from || "";
  const to = range.to || fallback?.to || "";
  const problem = from && to ? rangeProblem(from, to) : null;
  const report = useSalesReport(
    from && to && !problem ? { from, to, movieId: range.film || undefined } : null,
  );
  const data = report.data;
  const activePreset =
    now === null
      ? null
      : SALES_PRESETS.find((preset) => {
          const days = presetRange(preset.value, now);
          return days.from === from && days.to === to;
        })?.value;

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Sales"
        description="Kept revenue from the settlement records, so it matches the money exactly. Lagos days."
        actions={
          <Button
            variant="outline"
            disabled={!data || data.totals.payments === 0}
            onClick={() =>
              data &&
              downloadFile(
                salesCsv(data),
                "text/csv;charset=utf-8",
                `koncave-sales-${data.from}-to-${data.to}.csv`,
              )
            }
          >
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />

      <div className="space-y-8">
        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick ranges">
              {SALES_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  disabled={now === null}
                  aria-pressed={activePreset === preset.value}
                  onClick={() => now !== null && void setRange(presetRange(preset.value, now))}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-sm transition-colors",
                    activePreset === preset.value
                      ? "border-brand/50 bg-brand/15 text-foreground"
                      : "border-white/10 text-white/60 hover:border-white/25 hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[10rem_10rem_14rem]">
              <label>
                <span className="text-xs text-white/50">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => void setRange({ from: e.target.value || null })}
                  className={cn(fieldClass, "mt-1 h-10 scheme-dark")}
                />
              </label>
              <label>
                <span className="text-xs text-white/50">To</span>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => void setRange({ to: e.target.value || null })}
                  className={cn(fieldClass, "mt-1 h-10 scheme-dark")}
                />
              </label>
              <label className="col-span-2 sm:col-span-1">
                <span className="text-xs text-white/50">Film</span>
                <select
                  value={range.film}
                  onChange={(e) => void setRange({ film: e.target.value || null })}
                  className={cn(fieldClass, "mt-1 h-10 appearance-none bg-surface-1")}
                >
                  <option value="">All films</option>
                  {films.data?.items.map((film) => (
                    <option key={film.id} value={film.id}>
                      {film.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {problem && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {problem}
            </p>
          )}
        </Panel>

        {problem ? null : !data ? (
          report.isError ? (
            <ErrorState title="The report couldn't load" onRetry={() => void report.refetch()} />
          ) : (
            <div className="space-y-6">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )
        ) : data.totals.payments === 0 ? (
          <Panel>
            <EmptyState
              icon={BarChart3}
              title="No sales between these days"
              hint="Try a wider range or another film."
            />
          </Panel>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Panel
                title="Totals"
                footer={
                  data.refunds.count > 0 && (
                    <>
                      Owed back, not counted: {data.refunds.count}{" "}
                      {data.refunds.count === 1 ? "payment" : "payments"},{" "}
                      {formatMoney(data.refunds.amount, data.currency)}
                    </>
                  )
                }
              >
                <Figures totals={data.totals} currency={data.currency} />
              </Panel>
              <Panel title="Passes by room">
                <ByRoom totals={data.totals} />
              </Panel>
            </div>
            <Panel
              flush
              title="By film"
              description="Highest gross first. Open a film for its showtimes."
            >
              <ByFilm report={data} />
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
