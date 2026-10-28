"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, MapPin, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, fieldClass } from "@/features/auth/form-parts";
import { phoneSchema } from "@/features/auth/schemas";
import { useNow, useViewerTimeZone } from "@/hooks/use-now";
import { formatClock, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useConcessionCart, useConcessionDraft } from "./cart";
import { DISPATCH_LEAD_MS, getMenu, validateAddress } from "./service";
import { useConcessionQuote } from "./use-quote";

/**
 * The snack bar, during checkout: pick items, check the delivery address, and the order is timed
 * to arrive before the film. Optional; closes 50 minutes before the start, when the kitchen
 * dispatches.
 */
export function SnackPicker({
  ticketId,
  showtimeStartTime,
  onDone,
}: {
  ticketId: string;
  showtimeStartTime: string;
  onDone: () => void;
}) {
  const now = useNow();
  const timeZone = useViewerTimeZone();
  const draft = useConcessionDraft(ticketId);
  const { update, setQuantity } = useConcessionCart();
  const { quote, pending } = useConcessionQuote(ticketId, showtimeStartTime);
  const menu = useQuery({
    queryKey: ["concessions", "menu"],
    queryFn: getMenu,
    staleTime: 300_000,
  });
  const [checking, setChecking] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const cutoff = Date.parse(showtimeStartTime) - DISPATCH_LEAD_MS;
  const closed = now !== null && now >= cutoff;
  const quantity = (id: string) =>
    draft.lines.find((line) => line.menuItemId === id)?.quantity ?? 0;
  const hasItems = draft.lines.length > 0;
  const serviceable = draft.validation?.isServiceable === true;

  async function checkAddress() {
    if (draft.address.trim().length < 8) {
      setAddressError("Enter your full delivery address, with the area and city.");
      return;
    }
    setAddressError(null);
    setChecking(true);
    try {
      update(ticketId, { validation: await validateAddress(draft.address) });
    } catch {
      setAddressError("We couldn't check that address just now. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  function proceed() {
    if (!hasItems) {
      update(ticketId, { skipped: true });
      onDone();
      return;
    }
    if (!serviceable) {
      setAddressError("Check your delivery address first.");
      return;
    }
    const phone = phoneSchema.safeParse(draft.recipientPhone);
    if (!phone.success) {
      setPhoneError(phone.error.issues[0]?.message ?? "Enter a valid number");
      return;
    }
    setPhoneError(null);
    onDone();
  }

  if (closed) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 rounded-2xl border border-white/10 bg-surface-1 p-6">
          <Clock3 className="mt-0.5 size-5 shrink-0 text-gold" />
          <div>
            <p className="font-semibold">Snack orders have closed for this showtime</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Orders close 50 minutes before the film, so they arrive in time. Next time, add snacks
              when you book.
            </p>
          </div>
        </div>
        <Button
          size="xl"
          onClick={() => {
            update(ticketId, { skipped: true });
            onDone();
          }}
        >
          Continue to review
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock3 className="size-4 text-gold" />
        Delivered before the film. Orders close at{" "}
        <time
          dateTime={new Date(cutoff).toISOString()}
          suppressHydrationWarning
          className="font-semibold text-foreground"
        >
          {formatClock(new Date(cutoff).toISOString(), timeZone)}
        </time>
        .
      </p>

      {/* Menu */}
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {(menu.data ?? []).map((item, index) => {
          const count = quantity(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border bg-surface-1 transition-colors",
                count > 0 ? "border-gold/60" : "border-white/10",
              )}
            >
              <div className="relative aspect-4/3 overflow-hidden bg-surface-2">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 16vw, (min-width: 640px) 25vw, 45vw"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-gold px-2.5 py-0.5 text-[0.65rem] font-bold text-black">
                    Popular
                  </span>
                )}
                {count > 0 && (
                  <span className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-gold text-xs font-bold text-black tabular-nums">
                    {count}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
                <p className="leading-tight font-semibold">{item.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(item.unitPrice, item.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Remove one ${item.name}`}
                      disabled={count === 0}
                      onClick={() => setQuantity(ticketId, item.id, count - 1)}
                      className="grid size-8 place-items-center rounded-full border border-white/12 transition-colors hover:border-white/30 disabled:opacity-30"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span
                      aria-live="polite"
                      className="w-6 text-center text-sm font-semibold tabular-nums"
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one ${item.name}`}
                      disabled={!item.isAvailable || count >= 10}
                      onClick={() => setQuantity(ticketId, item.id, count + 1)}
                      className="grid size-8 place-items-center rounded-full border border-white/12 transition-colors hover:border-gold hover:bg-gold hover:text-black disabled:opacity-30"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {menu.isPending &&
          Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="aspect-3/4 rounded-2xl bg-white/3" aria-hidden="true" />
          ))}
      </ul>

      {/* Delivery */}
      {hasItems && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-surface-1 p-5 sm:p-6">
          <p className="font-display text-lg font-extrabold">Where should we deliver?</p>
          <div>
            <FieldLabel htmlFor="delivery-address">Delivery address</FieldLabel>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="delivery-address"
                autoComplete="street-address"
                value={draft.address}
                onChange={(event) =>
                  update(ticketId, { address: event.target.value, validation: null })
                }
                placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
                className={cn(fieldClass, "sm:flex-1")}
              />
              <Button
                type="button"
                size="lg"
                variant="glass"
                className="h-12"
                disabled={checking}
                onClick={() => void checkAddress()}
              >
                <MapPin data-icon="inline-start" />
                {checking ? "Checking…" : "Check address"}
              </Button>
            </div>
            <FieldError message={addressError ?? undefined} />
            {draft.validation &&
              (draft.validation.isServiceable ? (
                <p className="mt-2 text-sm text-lobby">
                  We deliver there. Delivery fee{" "}
                  {formatMoney(draft.validation.deliveryFee, draft.validation.currency)}.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gold">{draft.validation.reason}</p>
              ))}
          </div>
          <div>
            <FieldLabel htmlFor="delivery-phone">Phone for the rider</FieldLabel>
            <input
              id="delivery-phone"
              type="tel"
              autoComplete="tel"
              value={draft.recipientPhone}
              onChange={(event) => update(ticketId, { recipientPhone: event.target.value })}
              placeholder="0803 123 4567"
              className={cn(fieldClass, "mt-2 block sm:max-w-xs")}
            />
            <FieldError message={phoneError ?? undefined} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="xl" onClick={proceed} disabled={pending && hasItems}>
          {hasItems
            ? `Add snacks${quote ? ` · ${formatMoney(quote.totalAmount, quote.currency)}` : ""}`
            : "Continue without snacks"}
          <ArrowRight data-icon="inline-end" />
        </Button>
        {hasItems && (
          <Button
            size="xl"
            variant="ghost"
            onClick={() => {
              update(ticketId, { skipped: true, lines: [] });
              onDone();
            }}
          >
            Skip snacks
          </Button>
        )}
      </div>
    </div>
  );
}
