"use client";

import { ArrowRight, CalendarPlus, Info, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { encode } from "uqr";

import { LocalTime, ScreeningStatus } from "@/components/cinema/live-time";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { ErrorState } from "@/components/console/states";
import { StatusBadge } from "@/components/console/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/env";
import type { TicketDetail } from "@/features/booking/api-types";
import { InviteLinks } from "@/features/booking/invite-links";
import { PriceBreakdown } from "@/features/booking/price-breakdown";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { ErrorCode, toApiError } from "@/lib/api";
import { formatCountdown, formatMoney } from "@/lib/format";

import { useServerNow } from "@/hooks/use-now";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/ics";

import { useSuiteGuests, useTicket } from "./queries";
import { ticketView } from "./ticket-state";

/* "Add to calendar" for a pass, built in the browser: an .ics file every calendar app opens,
   and a Google Calendar link. No third party sees the booking until the member chooses. */

/** A pass as a calendar event, with a reminder when the lobby opens */
export function passEvent(ticket: TicketDetail, appUrl: string): CalendarEvent {
  const watchUrl = new URL(`/watch/${ticket.id}`, appUrl).toString();
  return {
    uid: `pass-${ticket.id}`,
    title: `${ticket.movieTitle} on Koncave Cinema`,
    start: ticket.startTime,
    end: ticket.endTime,
    description: `Pass ${ticket.seatIdentifier}. The lobby opens 30 minutes before the start. Watch: ${watchUrl}`,
    url: watchUrl,
    location: "Koncave Cinema (online)",
    // When the lobby opens
    reminderMinutes: 30,
  };
}

/**
 * The pass's admission code as a QR, drawn as one SVG path from the encoded grid (no canvas, no
 * network, no injected markup). Dark on white, as scanners expect. Online screenings don't
 * scan it at a door; it identifies the pass to support at a glance.
 */
function PassQr({ payload, label }: { payload: string; label: string }) {
  const { data, size } = encode(payload, { border: 2, ecc: "M" });
  let path = "";
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="size-full rounded-lg bg-white"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}

const CRUMBS = [{ href: "/dashboard/tickets", label: "My tickets" }];

/** The pass itself: a ticket with its stub (pass number and code). */
function PassCard({ ticket }: { ticket: TicketDetail }) {
  const hall = AUDITORIUMS.find((item) => item.tier === ticket.tier);
  const cancelled = ticket.status === "CANCELLED";
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-surface-1 sm:grid sm:grid-cols-[1fr_13rem]">
      <div>
        <div className="relative aspect-21/9">
          <Image
            src={ticket.posterLandscape}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 40rem, 100vw"
            className={cancelled ? "object-cover opacity-50 grayscale" : "object-cover"}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,var(--color-surface-1)_100%)]"
          />
        </div>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <p className="text-[0.7rem] font-bold tracking-[0.28em] text-brand uppercase">
            Admit · {hall?.kind ?? ticket.tier}
            {ticket.isSuiteHost && " · host"}
          </p>
          <p className="mt-2 font-display text-2xl leading-tight font-extrabold sm:text-3xl">
            {ticket.movieTitle}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-white/45">Starts</dt>
              <dd className="mt-1 font-medium">
                <LocalTime iso={ticket.startTime} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Lobby opens</dt>
              <dd className="mt-1 font-medium">
                <LocalTime iso={ticket.lobbyOpensAt} format="clock" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Room</dt>
              <dd className="mt-1 font-medium">{hall?.name ?? ticket.tier}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Paid</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {ticket.pricing.totalPayable === 0
                  ? "Guest of the host"
                  : formatMoney(ticket.pricing.totalPayable, ticket.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t-2 border-dashed border-white/12 px-6 py-6 text-center sm:border-t-0 sm:border-l-2">
        <div className="size-28">
          <PassQr
            payload={ticket.qrAdmissionPayload}
            label={`Admission code for pass ${ticket.seatIdentifier}`}
          />
        </div>
        <p className="text-[0.65rem] font-bold tracking-[0.24em] text-white/45 uppercase">
          Pass number
        </p>
        <p className="font-mono text-base font-semibold tracking-wider">{ticket.seatIdentifier}</p>
      </div>
    </article>
  );
}

/** Why a pass was cancelled and where its money is. */
function CancelledNotice({ ticket }: { ticket: TicketDetail }) {
  const refund = ticket.refund;
  return (
    <Panel tone="danger" title="This pass was cancelled">
      <div className="space-y-3 text-sm text-white/70">
        <p>
          {ticket.cancellation?.reason === "SHOWTIME_CANCELLED"
            ? "The screening was cancelled."
            : "The pass was cancelled by our support team."}
          {ticket.cancellation?.message && <> Reason given: “{ticket.cancellation.message}”</>}
        </p>
        {refund?.state === "PENDING" && (
          <p>
            Your refund of{" "}
            <strong className="text-foreground">
              {formatMoney(refund.amount, refund.currency)}
            </strong>{" "}
            is on its way to the card or account you paid with. We&rsquo;ll email you when
            it&rsquo;s done.
          </p>
        )}
        {refund?.state === "REFUNDED" && (
          <p>
            We refunded{" "}
            <strong className="text-foreground">
              {formatMoney(refund.amount, refund.currency)}
            </strong>
            {refund.refundedAt && (
              <>
                {" "}
                on <LocalTime iso={refund.refundedAt} />
              </>
            )}
            . Banks can take a few working days to show it.
          </p>
        )}
        <p className="text-white/50">
          Questions? Email {SUPPORT_EMAIL} with pass{" "}
          <span className="font-mono text-white/75">{ticket.seatIdentifier}</span>.
        </p>
      </div>
    </Panel>
  );
}

/** Who has taken a seat in the host's suite. */
function SuiteGuests({ ticket }: { ticket: TicketDetail }) {
  const guests = useSuiteGuests(ticket.id, ticket.isSuiteHost);
  const seats = ticket.suiteSeats ?? 0;
  const taken = ticket.suiteSeatsTaken ?? 1;
  return (
    <Panel title="Your guests" description={`${taken} of ${seats} seats taken, you included`} flush>
      {guests.isPending ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : guests.isError ? (
        <ErrorState title="Guests couldn't load" onRetry={() => void guests.refetch()} />
      ) : guests.data.length === 0 ? (
        <p className="flex items-center gap-3 px-5 py-6 text-sm text-white/50">
          <Users aria-hidden="true" className="size-4" />
          Nobody has joined yet. Share your invite link to fill the suite.
        </p>
      ) : (
        <ul className="divide-y divide-white/6">
          {guests.data.map((guest) => (
            <li key={guest.seatIdentifier} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="grid size-8 place-items-center rounded-full bg-white/8 text-xs font-bold uppercase">
                {(guest.publicScreenAlias ?? "G").charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {guest.publicScreenAlias ?? "Guest"}
                </span>
                <span className="block font-mono text-xs text-white/40">
                  {guest.seatIdentifier}
                </span>
              </span>
              <span className="text-xs text-white/45">
                Joined <LocalTime iso={guest.joinedAt} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** When the doors open, and the way in. */
function WatchPanel({ ticket, now }: { ticket: TicketDetail; now: number | null }) {
  const view = ticketView(ticket, now ?? 0);
  const untilLobby = now === null ? null : Date.parse(ticket.lobbyOpensAt) - now;
  return (
    <Panel title="Watch">
      <div className="space-y-4">
        <ScreeningStatus startTime={ticket.startTime} endTime={ticket.endTime} />
        {view.watchable ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/watch/${ticket.id}`}>
              {view.phase === "live" ? "Watch now" : "Enter lobby"}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : view.phase === "upcoming" ? (
          <>
            <Button size="lg" className="w-full" disabled>
              Lobby opens at <LocalTime iso={ticket.lobbyOpensAt} format="clock" />
            </Button>
            <p className="text-xs text-white/50">
              {untilLobby !== null && untilLobby > 0
                ? `The doors open in ${formatCountdown(untilLobby)}, 30 minutes before the film.`
                : "The doors open 30 minutes before the film."}{" "}
              One screen per pass.
            </p>
          </>
        ) : (
          <p className="text-sm text-white/55">This screening has ended.</p>
        )}
      </div>
    </Panel>
  );
}

/** The pass page's shape while it loads */
export function PassSkeleton() {
  return (
    <>
      <PageHeader title={<Skeleton className="h-8 w-64" />} crumbs={CRUMBS} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </>
  );
}

/**
 * /dashboard/tickets/[ticketId]: one pass, in full. Booking emails link here. The ticket comes
 * from GET /tickets/:id, so the page is right after a reload, a payment or a cancellation.
 */
export function PassView({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const ticket = useTicket(ticketId);
  const now = useServerNow();

  if (ticket.isPending) return <PassSkeleton />;

  if (ticket.isError) {
    const notFound = toApiError(ticket.error).is(ErrorCode.NOT_FOUND, ErrorCode.FORBIDDEN);
    return (
      <>
        <PageHeader title="Pass" crumbs={CRUMBS} />
        <div className="rounded-3xl border border-dashed border-white/12">
          {notFound ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold">We can&rsquo;t find that pass</p>
              <p className="mt-1.5 text-sm text-white/50">
                It may belong to another account, or the link is incomplete.
              </p>
              <Button asChild className="mt-5">
                <Link href="/dashboard/tickets">See my tickets</Link>
              </Button>
            </div>
          ) : (
            <ErrorState title="This pass couldn't load" onRetry={() => void ticket.refetch()} />
          )}
        </div>
      </>
    );
  }

  const detail = ticket.data;
  const view = ticketView(detail, now ?? 0);
  const passHref = `/dashboard/tickets/${detail.id}`;
  const primary = view.action && view.action.href !== passHref ? view.action : null;
  const active = detail.status === "CONFIRMED" || detail.status === "CHECKED_IN";
  const seatsLeft = Math.max(0, (detail.suiteSeats ?? 0) - (detail.suiteSeatsTaken ?? 1));

  return (
    <>
      <PageHeader
        crumbs={CRUMBS}
        title={detail.movieTitle}
        meta={
          <StatusBadge kind={view.badge.kind} status={view.badge.status} label={view.badge.label} />
        }
        actions={
          primary && (
            <Button asChild>
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <PassCard ticket={detail} />
          {detail.status === "CANCELLED" && <CancelledNotice ticket={detail} />}
          {detail.isSuiteHost && active && view.phase !== "ended" && detail.roomInviteCode && (
            <InviteLinks code={detail.roomInviteCode} seatsLeft={seatsLeft} />
          )}
          {detail.isSuiteHost && active && <SuiteGuests ticket={detail} />}
        </div>

        <aside className="space-y-6">
          {active && <WatchPanel ticket={detail} now={now} />}

          {active && view.phase !== "ended" && (
            <Panel title="Add to calendar">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    downloadIcs(
                      passEvent(detail, env.NEXT_PUBLIC_APP_URL),
                      `${detail.movieSlug}-${detail.seatIdentifier}`,
                    );
                    toast.success("Calendar file saved", {
                      description: "Open it to add the screening, with a reminder at the lobby.",
                    });
                  }}
                >
                  <CalendarPlus data-icon="inline-start" />
                  Apple, Outlook and others
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={googleCalendarUrl(passEvent(detail, env.NEXT_PUBLIC_APP_URL))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Calendar
                  </a>
                </Button>
              </div>
            </Panel>
          )}

          {detail.pricing.totalPayable > 0 && (
            <Panel title="Payment">
              <PriceBreakdown pricing={detail.pricing} />
            </Panel>
          )}

          <p className="flex gap-2.5 px-1 text-xs leading-relaxed text-white/45">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Need help with this pass? Email {SUPPORT_EMAIL} with{" "}
              <span className="font-mono text-white/70">{detail.seatIdentifier}</span>. We never ask
              for your password.
            </span>
          </p>
        </aside>
      </div>
    </>
  );
}
