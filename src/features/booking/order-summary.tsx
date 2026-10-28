"use client";

import Image from "next/image";

import { LocalTime } from "@/components/cinema/live-time";
import type { ConcessionQuote } from "@/features/concessions/api-types";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatMoney } from "@/lib/format";

import { HoldTimer } from "./hold-timer";
import { PriceBreakdown } from "./price-breakdown";
import { quoteCheckout, type Checkout } from "./service";

/** The total the viewer will pay, from the quote (never added up here) */
export function checkoutTotal(checkout: Checkout, concessions: ConcessionQuote | null) {
  return quoteCheckout(
    checkout.receipt,
    concessions && concessions.items.length ? concessions : null,
  );
}

/**
 * The booking at a glance: film, room, pass, both price breakdowns and the hold. Shown pinned
 * beside every checkout step on desktop, and in the summary sheet on phones.
 */
export function OrderSummaryContent({
  checkout,
  concessions,
}: {
  checkout: Checkout;
  concessions: ConcessionQuote | null;
}) {
  const { receipt, showtime } = checkout;
  const hall = AUDITORIUMS.find((item) => item.tier === receipt.tier);
  const total = checkoutTotal(checkout, concessions);
  const money = (amount: number) => formatMoney(amount, receipt.pricing.currency);
  const hasSnacks = Boolean(concessions && concessions.items.length);

  return (
    <div className="space-y-5">
      <HoldTimer lockExpiresAt={receipt.lockExpiresAt} />
      <div className="flex gap-4">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
          <Image src={showtime.posterLandscape} alt="" fill sizes="7rem" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="leading-tight font-semibold">{showtime.movieTitle}</p>
          <p className="mt-1 text-sm text-white/60">
            <LocalTime iso={showtime.startTime} />
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-white/8 pt-4 text-sm">
        <div>
          <dt className="text-xs text-white/45">Room</dt>
          <dd className="mt-1 font-medium">{hall?.name ?? receipt.tier}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/45">Pass</dt>
          <dd className="mt-1 font-mono text-[0.8rem] font-medium">{receipt.seatIdentifier}</dd>
        </div>
      </dl>

      <div className="border-t border-white/8 pt-4">
        <p className="mb-2.5 text-[0.65rem] font-bold tracking-[0.24em] text-white/40 uppercase">
          Ticket
        </p>
        <PriceBreakdown pricing={receipt.pricing} showTotal={hasSnacks} />
      </div>

      {concessions && hasSnacks && (
        <div className="border-t border-white/8 pt-4">
          <p className="mb-2.5 text-[0.65rem] font-bold tracking-[0.24em] text-white/40 uppercase">
            Snacks
          </p>
          <dl className="space-y-2 text-sm">
            {concessions.items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between gap-4 text-white/60">
                <dt>
                  {item.quantity} × {item.itemName}
                </dt>
                <dd className="tabular-nums">{money(item.lineTotal)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 text-white/60">
              <dt>Delivery</dt>
              <dd className="tabular-nums">{money(concessions.deliveryFee)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-4">
        <p className="font-semibold">Total</p>
        <p className="font-display text-2xl font-extrabold tabular-nums">
          {money(total.totalPayable)}
        </p>
      </div>
      {hasSnacks && !total.concessionsIncluded && (
        <p className="text-xs text-gold">
          Snacks can&rsquo;t be paid with your ticket yet, so they aren&rsquo;t in this total.
        </p>
      )}
    </div>
  );
}
