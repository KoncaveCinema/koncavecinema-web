"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  FilePlus2,
  Loader,
  Undo2,
  UserSearch,
} from "lucide-react";
import Link from "next/link";

import { PageHeader, SectionLabel } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatTile, StatTileSkeleton } from "@/components/console/stat-tile";
import { EmptyState, ErrorState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoneyExact } from "@/lib/format";

import type { AdminOverview, AdminSalesWindow, PublishRequirement } from "./api-types";
import { useOverview } from "./queries";

const QUICK_ACTIONS = [
  { href: "/admin/films/new", label: "New film", hint: "Start a draft", icon: FilePlus2 },
  {
    href: "/admin/showtimes",
    label: "Add showtime",
    hint: "Schedule a screening",
    icon: CalendarClock,
  },
  {
    href: "/admin/members",
    label: "Find a member",
    hint: "By email or alias",
    icon: UserSearch,
  },
];

const WINDOWS: { key: keyof AdminOverview["sales"]; label: string }[] = [
  { key: "today", label: "Last 24 hours" },
  { key: "last7Days", label: "Last 7 days" },
  { key: "last30Days", label: "Last 30 days" },
];

const MISSING_LABEL: Record<PublishRequirement, string> = {
  certificate: "No certificate",
  "master video": "No master",
  trailer: "No trailer",
  posters: "No posters",
};

/** One period's takings: the gross in display type, then how it splits. */
function SalesColumn({ label, sales }: { label: string; sales: AdminSalesWindow }) {
  const rows = [
    { label: "Passes sold", value: sales.passesSold.toLocaleString("en-NG") },
    { label: "Producer share", value: formatMoneyExact(sales.producerShare) },
    { label: "Platform share", value: formatMoneyExact(sales.platformShare) },
  ];
  return (
    <div className="p-6">
      <p className="text-[0.68rem] font-bold tracking-[0.2em] text-white/50 uppercase">{label}</p>
      <p className="mt-3 font-display text-3xl leading-none font-black tracking-tight tabular-nums">
        {formatMoneyExact(sales.gross)}
      </p>
      <p className="mt-1.5 text-xs text-white/45">Gross collected</p>
      <dl className="mt-5 space-y-2.5 border-t border-white/8 pt-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-white/55">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * /admin: the day at a glance. What's screening, what's owed back and what's still processing
 * first; then how sales are going; then the drafts that can't be published yet.
 */
export function OverviewPage() {
  const overview = useOverview();
  const data = overview.data;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description="Today's screenings, sales and the work waiting for you. Times are Lagos time."
        actions={
          <Button asChild>
            <Link href="/admin/films/new">
              <FilePlus2 data-icon="inline-start" />
              New film
            </Link>
          </Button>
        }
      />

      {overview.isPending ? (
        <OverviewSkeleton />
      ) : overview.isError || !data ? (
        <ErrorState title="The overview couldn't load" onRetry={() => void overview.refetch()} />
      ) : (
        <div className="space-y-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Screenings today"
              value={data.screeningsToday}
              hint="Starting today, Lagos time"
              icon={CalendarDays}
              tone="brand"
              href="/admin/showtimes"
            />
            <StatTile
              label="This week"
              value={data.screeningsThisWeek}
              hint="Starting in the next 7 days"
              icon={CalendarClock}
              tone="neutral"
              href="/admin/showtimes"
            />
            <StatTile
              label="Refunds waiting"
              value={data.refundsWaiting.count}
              hint={
                data.refundsWaiting.count > 0
                  ? `${formatMoneyExact(data.refundsWaiting.amount)} owed back`
                  : "Nothing owed back"
              }
              icon={Undo2}
              tone="gold"
              emphasis={data.refundsWaiting.count > 0}
              href="/admin/refunds"
            />
            <StatTile
              label="Videos processing"
              value={data.videosProcessing}
              hint={data.videosProcessing === 1 ? "upload at Mux" : "uploads at Mux"}
              icon={Loader}
              tone="lobby"
              href="/admin/films"
            />
          </div>

          <Panel
            flush
            title="Sales"
            description="Kept revenue: payments owed back are left out until they're refunded."
            actions={
              <Link
                href="/admin/sales"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-foreground"
              >
                Sales report
                <ArrowRight className="size-4" />
              </Link>
            }
          >
            <div className="grid divide-y divide-white/8 md:grid-cols-3 md:divide-x md:divide-y-0">
              {WINDOWS.map((window) => (
                <SalesColumn key={window.key} label={window.label} sales={data.sales[window.key]} />
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <Panel
              flush
              title="Needs attention"
              description="Drafts that can't be published until these are in place."
            >
              {data.filmsNeedingAttention.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Every draft has its certificate and master"
                  hint="New drafts that are missing either show up here."
                />
              ) : (
                <ul className="divide-y divide-white/8">
                  {data.filmsNeedingAttention.map((film) => (
                    <li key={film.id}>
                      <Link
                        href={`/admin/films/${film.id}`}
                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-white/60 ring-1 ring-white/8">
                          <Clapperboard aria-hidden="true" className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{film.title}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {film.missing.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[0.68rem] font-semibold text-gold"
                              >
                                {MISSING_LABEL[item]}
                              </span>
                            ))}
                          </span>
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-white/25 transition-colors group-hover:text-foreground"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <nav aria-labelledby="quick-title" className="space-y-4">
              <SectionLabel>
                <span id="quick-title">Quick actions</span>
              </SectionLabel>
              <ul className="space-y-3">
                {QUICK_ACTIONS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,var(--color-surface-2),var(--color-surface-1)_70%)] p-4 transition-colors hover:border-white/25"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/6 text-white/70 ring-1 ring-white/10 transition-colors group-hover:bg-brand/15 group-hover:text-[#ff5a63] group-hover:ring-brand/30">
                        <item.icon aria-hidden="true" className="size-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-xs text-white/50">{item.hint}</span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 text-white/25 transition-colors group-hover:text-foreground"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
