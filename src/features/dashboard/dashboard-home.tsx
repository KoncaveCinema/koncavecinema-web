"use client";

import { cn } from "cn";
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  DoorOpen,
  Film,
  LifeBuoy,
  Settings,
  Ticket,
  Timer,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LocalTime } from "@/components/cinema/live-time";
import { PageHeader } from "@/components/console/page-header";
import { SectionLabel } from "@/components/console/page-header";
import { StatTile, StatTileSkeleton } from "@/components/console/stat-tile";
import { EmptyState, ErrorState } from "@/components/console/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session";
import type { TicketDetail } from "@/features/booking/api-types";
import { formatCountdown, formatElapsed } from "@/lib/format";

import { useMyTickets } from "./queries";
import { roomName, TicketCard, TicketCardSkeleton } from "./ticket-card";
import { ticketView } from "./ticket-state";
import { useServerNow } from "@/hooks/use-now";

const SHORTCUTS = [
  {
    href: "/dashboard/tickets",
    label: "My tickets",
    hint: "Passes, holds and history",
    icon: Ticket,
  },
  { href: "/movies", label: "Browse films", hint: "What's premiering now", icon: Clapperboard },
  {
    href: "/dashboard/settings",
    label: "Settings",
    hint: "Alias, password, account",
    icon: Settings,
  },
  { href: "/help", label: "Help", hint: "Answers and support", icon: LifeBuoy },
];

/** The big clock on the hero: what happens next, and how long until it does. */
function heroClock(ticket: TicketDetail, now: number | null) {
  if (now === null) return { label: "Starts", value: null, live: false, lobby: false };
  const start = Date.parse(ticket.startTime);
  const lobby = Date.parse(ticket.lobbyOpensAt);
  if (now >= start) {
    return {
      label: "Live now",
      value: `${formatElapsed(now - start)} in`,
      live: true,
      lobby: false,
    };
  }
  if (now >= lobby) {
    return {
      label: "Lobby open · starts in",
      value: formatCountdown(start - now),
      live: false,
      lobby: true,
    };
  }
  return {
    label: "Lobby opens in",
    value: formatCountdown(lobby - now),
    live: false,
    lobby: false,
  };
}

/** A hold still running: the one thing that can't wait, so it comes first. */
function HoldBanner({ ticket, now }: { ticket: TicketDetail; now: number | null }) {
  const left = now !== null && ticket.lockExpiresAt ? Date.parse(ticket.lockExpiresAt) - now : null;
  return (
    <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 overflow-hidden rounded-2xl border border-gold/35 bg-[linear-gradient(100deg,rgb(245_183_0/0.12),rgb(245_183_0/0.03)_60%)] px-5 py-4 sm:flex sm:gap-x-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
        <Timer aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Finish booking {ticket.movieTitle}</p>
        <p className="mt-0.5 text-sm text-white/60">
          Your {roomName(ticket.tier).toLowerCase()} seat is held
          {left !== null && left > 0 && (
            <>
              {" "}
              for{" "}
              <span className="font-semibold text-gold tabular-nums">{formatCountdown(left)}</span>
            </>
          )}
          . After that it goes back on sale.
        </p>
      </div>
      <Button asChild className="col-span-2 w-full sm:w-auto">
        <Link href={`/checkout/${ticket.id}`}>
          Continue booking
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}

/** The next screening, as the film page opens: the still across the stage, and the way in. */
function NextScreening({ ticket, now }: { ticket: TicketDetail; now: number | null }) {
  const view = ticketView(ticket, now ?? 0);
  const clock = heroClock(ticket, now);
  const passHref = `/dashboard/tickets/${ticket.id}`;
  return (
    <section
      aria-labelledby="next-title"
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-40px_rgb(214_2_17/0.5)]"
    >
      <Image
        src={ticket.posterLandscape}
        alt=""
        fill
        priority
        sizes="(min-width: 1280px) 72rem, 100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(0_0_0/0.9)_0%,rgb(0_0_0/0.55)_50%,rgb(0_0_0/0.15)_100%),linear-gradient(0deg,rgb(0_0_0/0.75)_0%,transparent_55%)]"
      />

      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end lg:p-12">
        <div className="[text-shadow:0_2px_24px_rgb(0_0_0/0.55)]">
          <SectionLabel className="text-white/80">Your next screening</SectionLabel>
          <h2
            id="next-title"
            className="mt-4 font-display text-[clamp(2.25rem,5vw,3.75rem)]/[0.95] font-black text-balance uppercase"
          >
            {ticket.movieTitle}
          </h2>
          <p className="mt-4 text-[0.95rem] text-white/75">
            <LocalTime iso={ticket.startTime} /> · {roomName(ticket.tier)}
          </p>

          <div className="mt-7 flex items-center gap-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl ring-1",
                clock.live
                  ? "bg-brand/25 text-[#ff5a63] ring-brand/50"
                  : clock.lobby
                    ? "bg-lobby/15 text-lobby ring-lobby/40"
                    : "bg-white/8 text-white/80 ring-white/15",
              )}
            >
              <DoorOpen aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.22em] text-white/55 uppercase">
                {clock.label}
              </p>
              <p className="mt-1 font-display text-3xl leading-none font-black tabular-nums sm:text-4xl">
                {clock.value ?? <LocalTime iso={ticket.startTime} format="clock" />}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {view.action && view.action.href !== passHref && (
              <Button asChild size="xl">
                <Link href={view.action.href}>
                  {view.action.label}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            )}
            <Button asChild size="xl" variant="glass">
              <Link href={passHref}>View pass</Link>
            </Button>
          </div>
        </div>

        {/* A pass stub on the stage (desktop): dark and solid enough to read on bright art */}
        <div className="relative hidden overflow-hidden rounded-2xl border border-white/15 bg-black/75 p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-xl lg:block">
          <p className="text-[0.62rem] font-bold tracking-[0.26em] text-brand uppercase">
            Admit one
          </p>
          <p className="mt-2 font-semibold">{roomName(ticket.tier)}</p>
          <div className="my-4 border-t-2 border-dashed border-white/15" />
          <p className="text-[0.62rem] font-bold tracking-[0.24em] text-white/45 uppercase">
            Pass number
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
            {ticket.seatIdentifier}
          </p>
          <p className="mt-3 text-xs text-white/55">
            Doors open <LocalTime iso={ticket.lobbyOpensAt} format="clock" />
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * /dashboard: what's next. A hold to finish comes first, then the next screening on the stage,
 * the numbers at a glance, the rest of the week as tickets, and the doors to everything else.
 */
export function DashboardHome() {
  const alias = useSession((state) => state.user?.publicScreenAlias);
  const now = useServerNow();
  const upcoming = useMyTickets("upcoming");
  const past = useMyTickets("past");

  const items = upcoming.data?.items ?? [];
  // The clock starts before the passes arrive; until then everything counts as ahead
  const at = now ?? 0;
  const holds = items.filter((ticket) => ticketView(ticket, at).phase === "hold");
  const screenings = items.filter((ticket) =>
    ["upcoming", "lobby", "live"].includes(ticketView(ticket, at).phase),
  );
  const [next, ...later] = screenings;
  const watched = (past.data?.items ?? []).filter(
    (ticket) => ticket.status === "CHECKED_IN",
  ).length;
  const untilLobby = next && now !== null ? Date.parse(next.lobbyOpensAt) - now : null;

  return (
    <>
      <PageHeader
        eyebrow="Your cinema"
        title={alias ? `Welcome back, ${alias}` : "Welcome back"}
        description="Your screenings, holds and account, in one place."
      />

      <div className="space-y-12">
        {upcoming.isPending ? (
          <>
            <Skeleton className="h-104 rounded-3xl" />
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </div>
            <TicketCardSkeleton />
          </>
        ) : upcoming.isError ? (
          <ErrorState
            title="Your screenings couldn't load"
            onRetry={() => void upcoming.refetch()}
          />
        ) : (
          <>
            {holds.length > 0 && (
              <div className="space-y-3">
                {holds.map((ticket) => (
                  <HoldBanner key={ticket.id} ticket={ticket} now={now} />
                ))}
              </div>
            )}

            {next ? (
              <NextScreening ticket={next} now={now} />
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-surface-1/60">
                <EmptyState
                  icon={Ticket}
                  title="No screenings booked"
                  hint="Premieres are announced every week. Pick a showtime and your pass will wait for you here."
                  action={
                    <Button asChild size="lg">
                      <Link href="/movies">
                        See what&rsquo;s showing
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  }
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile
                label="Upcoming"
                value={screenings.length}
                hint={screenings.length === 1 ? "screening booked" : "screenings booked"}
                icon={Ticket}
                tone="brand"
                href="/dashboard/tickets"
              />
              <StatTile
                label="Next lobby"
                value={
                  untilLobby === null ? "—" : untilLobby <= 0 ? "Open" : formatCountdown(untilLobby)
                }
                hint={
                  next ? `${next.movieTitle}, 30 minutes before the film` : "Nothing booked yet"
                }
                icon={DoorOpen}
                tone="lobby"
              />
              <StatTile
                label="Watched"
                value={past.isPending ? "…" : watched}
                hint={watched === 1 ? "film on Koncave" : "films on Koncave"}
                icon={Film}
                tone="gold"
                href="/dashboard/tickets?when=past"
              />
            </div>

            {later.length > 0 && (
              <section aria-labelledby="later-title" className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>Coming up</SectionLabel>
                    <h2 id="later-title" className="mt-3 font-display text-2xl font-extrabold">
                      The rest of your week
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/tickets"
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-white/60 transition-colors hover:text-foreground"
                  >
                    All tickets
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
                <ul className="space-y-4">
                  {later.slice(0, 3).map((ticket) => (
                    <li key={ticket.id}>
                      <TicketCard ticket={ticket} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <nav aria-labelledby="shortcuts-title" className="space-y-5">
          <SectionLabel>
            <span id="shortcuts-title">Shortcuts</span>
          </SectionLabel>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SHORTCUTS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group relative flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,var(--color-surface-2),var(--color-surface-1)_70%)] p-5 transition-colors hover:border-white/25"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-white/6 text-white/70 ring-1 ring-white/10 transition-colors group-hover:bg-brand/15 group-hover:text-[#ff5a63] group-hover:ring-brand/30">
                    <item.icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-white/50">{item.hint}</span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="absolute top-5 right-5 size-4 text-white/25 transition-colors group-hover:text-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
