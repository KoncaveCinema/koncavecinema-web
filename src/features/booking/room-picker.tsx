"use client";

import { ArrowLeft, ArrowRight, Check, DoorOpen, Fingerprint, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState, useTransition } from "react";

import { LocalTime } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { IdentityCheck } from "@/features/auth/identity-check";
import { useSession } from "@/features/auth/session";
import type { ApiShowtimeCapacity, ApiTierCapacity } from "@/features/catalog/api-types";
import { lobbyOpensAt, screeningPhase } from "@/features/catalog/screening";
import type { TicketTier } from "@/features/catalog/types";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { useNow } from "@/hooks/use-now";
import { ErrorCode, newIdempotencyKey, toApiError } from "@/lib/api";
import { formatMoney, formatRuntime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BookingSteps, type BookingStepId } from "./booking-steps";
import { PriceBreakdown } from "./price-breakdown";
import type { HeldTicketDetails } from "./api-types";
import { heldTicketFrom, rememberShowtime, reserveTicket, snacksAvailable } from "./service";
import { SummaryBar } from "./summary-bar";

const TIERS = ["INDIVIDUAL", "PUBLIC", "PRIVATE_5", "PRIVATE_10"] as const;
const roomParser = parseAsStringLiteral(TIERS);

export interface RoomStepFilm {
  slug: string;
  title: string;
  posterLandscape: string;
  posterPortrait: string;
  durationMinutes: number;
}

function errorMessage(code: string): string {
  switch (code) {
    case ErrorCode.SCREENING_SOLD_OUT:
      return "That room is sold out for this showtime. Try another room or showtime.";
    case ErrorCode.SCREENING_CONCLUDED:
      return "This screening has ended.";
    case ErrorCode.RESERVATION_ALREADY_HELD:
      return "You already have a seat on hold for this showtime.";
    case ErrorCode.RESERVATION_IN_PROGRESS:
      return "We're still holding your seat. Try again in a moment.";
    default:
      return "We couldn't hold your seat. Please try again.";
  }
}

function RoomCard({
  tier,
  selected,
  onSelect,
}: {
  tier: ApiTierCapacity;
  selected: boolean;
  onSelect: () => void;
}) {
  const hall = AUDITORIUMS.find((item) => item.tier === tier.tier);
  const suite = tier.seatCount > 1;
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={cn(
          "group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface-1 text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.99]",
          selected
            ? "border-brand shadow-[0_0_0_1px_var(--color-brand),0_18px_50px_-20px_rgb(214_2_17/0.6)]"
            : "border-white/10 hover:border-white/30",
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden">
          {hall && (
            <Image
              src={hall.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 92vw"
              className="object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.03]"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--color-surface-1)_100%)]"
          />
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-3 right-3 grid size-7 place-items-center rounded-full border-2 transition-colors",
              selected ? "border-brand bg-brand" : "border-white/60 bg-black/40",
            )}
          >
            {selected && <Check className="size-4" />}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5">
          <p className="text-[0.65rem] font-bold tracking-[0.24em] text-brand uppercase">
            {hall?.kind ?? tier.tierName}
          </p>
          <p className="mt-1 font-display text-xl leading-tight font-extrabold">
            {hall?.name ?? tier.tierName}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/65">
            {(hall?.features ?? [tier.description]).slice(0, 3).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-lobby" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-white/75">
                <Users className="size-3.5" />
                {suite ? `Up to ${tier.seatCount}` : "1 admission"}
              </span>
              {tier.requiresKyc && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-gold">
                  <Fingerprint className="size-3.5" />
                  Identity check
                </span>
              )}
            </div>
            <p className="text-right">
              <span className="block font-display text-2xl leading-none font-extrabold tabular-nums">
                {formatMoney(tier.pricing.totalPayable, tier.pricing.currency)}
              </span>
              <span className="text-[0.7rem] text-white/45">
                {suite ? "per suite" : "per ticket"}, fees included
              </span>
            </p>
          </div>
        </div>
      </button>
    </li>
  );
}

/**
 * Step 1 of booking: choose a room for one showtime. Continuing holds the seat for 10 minutes
 * (signed in), or goes through sign-in first and comes back with the room still chosen.
 */
export function RoomPicker({
  capacity,
  film,
}: {
  capacity: ApiShowtimeCapacity;
  film: RoomStepFilm;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const now = useNow();
  const { status, user } = useSession();
  const [verifying, setVerifying] = useState(false);
  const [held, setHeld] = useState<HeldTicketDetails | null>(null);
  const [room, setRoom] = useQueryState("room", roomParser);
  // A transition, not a flag: it ends by itself once the checkout page has loaded, so coming
  // back to this page (which keeps its state) never finds the button stuck on "Holding…"
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(newIdempotencyKey);

  useEffect(() => {
    rememberShowtime(capacity, {
      posterPortrait: film.posterPortrait,
      posterLandscape: film.posterLandscape,
    });
  }, [capacity, film.posterPortrait, film.posterLandscape]);

  const ended = now !== null && screeningPhase(capacity, now) === "ended";
  const selected = capacity.tiers.find((tier) => tier.tier === room);
  const needsIdentity = selected?.requiresKyc === true;
  const verified = user?.isPhoneVerified === true;
  const steps: BookingStepId[] = [
    "room",
    ...(needsIdentity ? (["identity"] as const) : []),
    ...(snacksAvailable ? (["snacks"] as const) : []),
    "review",
  ];

  /** Holds the seat (POST /tickets/reserve), then opens checkout */
  function reserve() {
    if (!selected) return;
    setError(null);
    setHeld(null);
    startTransition(async () => {
      try {
        const receipt = await reserveTicket(
          capacity.showtimeId,
          selected.tier as TicketTier,
          attemptKey,
        );
        setAttemptKey(newIdempotencyKey());
        router.push(`/checkout/${receipt.ticketId}`);
      } catch (caught) {
        const apiError = toApiError(caught);
        setAttemptKey(newIdempotencyKey());
        if (apiError.is(ErrorCode.KYC_REQUIRED)) {
          setVerifying(true);
          return;
        }
        const existing = apiError.is(ErrorCode.RESERVATION_ALREADY_HELD)
          ? heldTicketFrom(apiError)
          : null;
        setHeld(existing);
        setError(
          existing && existing.status !== "RESERVED"
            ? "You already have a pass for this showtime."
            : errorMessage(apiError.code),
        );
      }
    });
  }

  function proceed() {
    if (!selected) return;
    if (status !== "signed-in") {
      const next = `${pathname}?room=${selected.tier}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    // The API holds a Public Hall seat only for verified members: verify first, then hold
    if (needsIdentity && !verified) {
      setVerifying(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    reserve();
  }

  const ctaLabel = ended
    ? "Screening ended"
    : pending
      ? "Holding your seat…"
      : status !== "signed-in"
        ? "Sign in to continue"
        : needsIdentity && !verified
          ? "Verify identity to continue"
          : snacksAvailable
            ? "Continue to snacks"
            : "Continue to review";

  const cta = (compact: boolean) => (
    <Button
      size={compact ? "lg" : "xl"}
      disabled={!selected || pending || ended}
      onClick={proceed}
      className={compact ? "shrink-0" : "w-full"}
    >
      {compact && selected && !pending && !ended ? "Continue" : ctaLabel}
      {!pending && !ended && <ArrowRight data-icon="inline-end" />}
    </Button>
  );

  const summary = (
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg">
          <Image src={film.posterLandscape} alt="" fill sizes="7rem" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="leading-tight font-semibold">{film.title}</p>
          <p className="mt-1 text-sm text-white/60">
            <LocalTime iso={capacity.startTime} />
          </p>
        </div>
      </div>
      <div className="border-t border-white/8 pt-4">
        <p className="text-xs text-white/45">Room</p>
        <p className="mt-1 font-medium">
          {selected
            ? (AUDITORIUMS.find((hall) => hall.tier === selected.tier)?.name ?? selected.tierName)
            : "Not chosen yet"}
        </p>
      </div>
      {selected && (
        <div className="border-t border-white/8 pt-4">
          <PriceBreakdown pricing={selected.pricing} showTotal={false} />
        </div>
      )}
    </div>
  );

  // A failed hold, with the way on when the member already has one. Rendered once per layout:
  // only one copy is ever visible, so it is announced once
  const notice = (
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <p className="text-destructive">{error}</p>
      {held && (
        <Link
          href={
            held.status === "RESERVED"
              ? `/checkout/${held.ticketId}`
              : `/account/tickets/${held.ticketId}`
          }
          className="font-semibold underline decoration-brand underline-offset-4"
        >
          {held.status === "RESERVED" ? "Continue your booking" : "View your pass"}
        </Link>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14">
      <div className="min-w-0">
        <Link
          href={`/movies/${film.slug}`}
          className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {film.title}
        </Link>
        <div className="mt-6">
          <BookingSteps
            steps={steps}
            current={verifying ? "identity" : "room"}
            done={(step) => (step === "room" && verifying) || (step === "identity" && verified)}
            onSelect={(step) => {
              if (step === "room") setVerifying(false);
            }}
          />
        </div>

        {verifying ? (
          <div className="mt-8">
            <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">
              Verify your identity
            </h1>
            <p className="mt-2 max-w-xl text-white/60">
              Public halls are open chat rooms, so each attendee is verified once, before the seat
              is held. Your 10-minute hold starts after this.
            </p>
            <div className="mt-8">
              <IdentityCheck
                onVerified={() => {
                  setVerifying(false);
                  reserve();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setVerifying(false)}
              className="mt-8 text-sm text-white/55 underline underline-offset-4 hover:text-foreground"
            >
              Choose a different room
            </button>
          </div>
        ) : (
          <>
            <h1 className="mt-8 font-display text-3xl leading-tight font-black sm:text-4xl">
              Choose your room
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
              <span className="font-semibold text-foreground">{film.title}</span>
              <LocalTime iso={capacity.startTime} />
              <span className="flex items-center gap-1.5">
                <DoorOpen className="size-3.5 text-lobby" />
                Lobby opens <LocalTime iso={lobbyOpensAt(capacity)} format="clock" />
              </span>
              <span>{formatRuntime(film.durationMinutes)}</span>
            </p>

            <ul
              role="radiogroup"
              aria-label="Choose your room"
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {capacity.tiers.map((tier) => (
                <RoomCard
                  key={tier.tier}
                  tier={tier}
                  selected={room === tier.tier}
                  onSelect={() => void setRoom(tier.tier as (typeof TIERS)[number])}
                />
              ))}
            </ul>
          </>
        )}
        {/* Mobile: under the rooms, just above the bottom bar. Desktop shows it in the panel */}
        {error && <div className="mt-5 lg:hidden">{notice}</div>}
      </div>

      {/* Desktop: the summary and the next step, pinned beside the rooms */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-white/10 bg-surface-1 p-6">
          <p className="mb-5 text-[0.7rem] font-bold tracking-[0.28em] text-white/45 uppercase">
            Your booking
          </p>
          {summary}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-extrabold tabular-nums">
                {selected
                  ? formatMoney(selected.pricing.totalPayable, selected.pricing.currency)
                  : "—"}
              </span>
            </div>
            {/* Beside the button that caused it, so the answer is where the click was */}
            {error && <div className="mb-4">{notice}</div>}
            {cta(false)}
            <p className="mt-3 text-center text-xs text-white/45">
              Your seat is held for 10 minutes while you check out.
            </p>
          </div>
        </div>
      </aside>

      <SummaryBar
        label={selected ? selected.tierName : "Choose a room"}
        total={
          selected ? formatMoney(selected.pricing.totalPayable, selected.pricing.currency) : "—"
        }
        action={cta(true)}
      >
        {summary}
      </SummaryBar>
    </div>
  );
}
