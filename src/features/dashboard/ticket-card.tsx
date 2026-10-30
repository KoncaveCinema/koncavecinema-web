"use client";

import { cn } from "cn";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LocalTime } from "@/components/cinema/live-time";
import { StatusBadge } from "@/components/console/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDetail } from "@/features/booking/api-types";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatCountdown } from "@/lib/format";

import { ticketView } from "./ticket-state";
import { useServerNow } from "@/hooks/use-now";

export function roomName(tier: TicketDetail["tier"]): string {
  return AUDITORIUMS.find((hall) => hall.tier === tier)?.kind ?? tier;
}

/** The punched half-circles where a ticket's stub tears off */
const NOTCHES =
  "before:absolute before:-top-3 before:-left-3 before:size-6 before:rounded-full before:bg-background before:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] after:absolute after:-bottom-3 after:-left-3 after:size-6 after:rounded-full after:bg-background after:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]";

/**
 * One pass in a list, drawn as a ticket: the film's still, the admission and the film, and a
 * torn-off stub with the pass number, its state and the one next step. The title opens the pass.
 */
export function TicketCard({ ticket }: { ticket: TicketDetail }) {
  const now = useServerNow();
  const view = ticketView(ticket, now ?? Date.parse(ticket.createdAt));
  const holdLeft =
    view.phase === "hold" && now !== null && ticket.lockExpiresAt
      ? Date.parse(ticket.lockExpiresAt) - now
      : null;
  const label = holdLeft !== null ? `On hold · ${formatCountdown(holdLeft)}` : view.badge.label;
  const passHref = `/dashboard/tickets/${ticket.id}`;
  const primary = view.action && view.action.href !== passHref;
  const faded = view.phase === "cancelled" || view.phase === "hold-expired";

  const action = view.action && (
    <Button
      asChild
      size="sm"
      variant={primary ? "default" : "outline"}
      className="relative z-10 h-9 px-4"
    >
      <Link href={view.action.href}>
        {view.action.label}
        {primary && <ArrowRight data-icon="inline-end" />}
      </Link>
    </Button>
  );

  return (
    <article className="group relative grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(120deg,var(--color-surface-2),var(--color-surface-1)_60%)] shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:grid-cols-[12rem_minmax(0,1fr)_13rem]">
      {/* The still, fading into the ticket */}
      {/* Clipped, so the still's hover zoom never spills past the fade */}
      <div className="relative min-h-36 overflow-hidden">
        <Image
          src={ticket.posterLandscape}
          alt=""
          fill
          sizes="(min-width: 640px) 12rem, 7.5rem"
          className={cn(
            "object-cover transition-transform duration-700 group-hover:scale-[1.04]",
            faded && "opacity-45 grayscale",
          )}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent_45%,var(--color-surface-2))]"
        />
      </div>

      {/* Admission and film */}
      <div className="flex min-w-0 flex-col justify-center gap-1.5 px-4 py-4 sm:px-6">
        <p className="text-[0.62rem] font-bold tracking-[0.26em] text-brand uppercase">
          Admit · {roomName(ticket.tier)}
        </p>
        <h3 className="font-display text-lg leading-tight font-extrabold sm:text-xl">
          <Link
            href={passHref}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {ticket.movieTitle}
          </Link>
        </h3>
        <p className="text-sm text-white/65">
          <LocalTime iso={ticket.startTime} />
        </p>
        {/* Phones: the stub's contents fold under the details */}
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          <StatusBadge kind={view.badge.kind} status={view.badge.status} label={label} />
          {view.note && <span className="text-xs text-white/55">{view.note}</span>}
          {action}
        </div>
      </div>

      {/* The stub */}
      <div
        className={cn(
          "relative hidden flex-col items-center justify-center gap-3 border-l-2 border-dashed border-white/12 px-4 py-4 text-center sm:flex",
          NOTCHES,
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <StatusBadge kind={view.badge.kind} status={view.badge.status} label={label} />
          {view.note && <p className="text-xs font-medium text-white/60">{view.note}</p>}
        </div>
        <p className="font-mono text-xs tracking-wider text-white/45">{ticket.seatIdentifier}</p>
        {action}
      </div>
    </article>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/10 bg-surface-1 sm:grid-cols-[12rem_minmax(0,1fr)_13rem]">
      <Skeleton className="min-h-36 rounded-none" />
      <div className="space-y-2.5 px-6 py-6">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <div className="hidden items-center justify-center border-l-2 border-dashed border-white/10 sm:flex">
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}
