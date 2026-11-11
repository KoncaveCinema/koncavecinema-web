"use client";

import Image from "next/image";

import type { TicketDetail } from "@/api/tickets/tickets-schemas";
import { LocalTime } from "@/components/cinema/live-time";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatMoney } from "@/lib/format";

import { HoldTimer } from "./hold-timer";
import { PriceBreakdown } from "./price-breakdown";

/**
 * The booking at a glance: film, room, pass, the price breakdown and the hold. Shown pinned
 * beside every checkout step on desktop, and in the summary sheet on phones. The total is the
 * API's own `totalPayable`.
 */
export function OrderSummaryContent({ ticket }: { ticket: TicketDetail }) {
  const hall = AUDITORIUMS.find((item) => item.tier === ticket.tier);
  const { pricing } = ticket;

  return (
    <div className="space-y-5">
      {ticket.lockExpiresAt && <HoldTimer lockExpiresAt={ticket.lockExpiresAt} />}
      <div className="flex gap-4">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
          <Image src={ticket.posterLandscape} alt="" fill sizes="7rem" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="leading-tight font-semibold">{ticket.movieTitle}</p>
          <p className="mt-1 text-sm text-white/60">
            <LocalTime iso={ticket.startTime} />
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-white/8 pt-4 text-sm">
        <div>
          <dt className="text-xs text-white/45">Room</dt>
          <dd className="mt-1 font-medium">{hall?.name ?? ticket.tier}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/45">Pass</dt>
          <dd className="mt-1 font-mono text-[0.8rem] font-medium">{ticket.seatIdentifier}</dd>
        </div>
      </dl>

      <div className="border-t border-white/8 pt-4">
        <p className="mb-2.5 text-[0.65rem] font-bold tracking-[0.24em] text-white/40 uppercase">
          Ticket
        </p>
        <PriceBreakdown pricing={pricing} showTotal={false} />
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-4">
        <p className="font-semibold">Total</p>
        <p className="font-display text-2xl font-extrabold tabular-nums">
          {formatMoney(pricing.totalPayable, pricing.currency)}
        </p>
      </div>
    </div>
  );
}
