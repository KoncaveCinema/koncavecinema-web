"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CreditCard,
  Landmark,
  Lock,
  ShieldCheck,
  Smartphone,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { use, useEffect, useState } from "react";

import { ErrorCode, newIdempotencyKey, toApiError } from "@/api";
import { useInitializeCheckout } from "@/api/payments/payments-api";
import { useGetTicket, useReleaseTicket } from "@/api/tickets/tickets-api";
import type { TicketDetail } from "@/api/tickets/tickets-schemas";
import { Button } from "@/components/ui/button";
import { IdentityCheck } from "@/features/auth/identity-check";
import { PageSkeleton, RequireSession } from "@/features/auth/require-session";
import { useSession } from "@/features/auth/session";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatMoney } from "@/lib/format";

import { BookingSteps, STEP_LABELS, type BookingStepId } from "./booking-steps";
import { useHoldExpired } from "./hold-timer";
import { OrderSummaryContent } from "./order-summary";
import { SummaryBar } from "./summary-bar";

const FLOW_STEPS = ["identity", "review"] as const;
type FlowStep = (typeof FLOW_STEPS)[number];
const stepParser = parseAsStringLiteral(FLOW_STEPS);

const INTRO: Record<FlowStep, string> = {
  identity:
    "Public halls are open chat rooms, so each attendee is verified once. It takes a minute.",
  review: "Check everything, then pay to confirm your pass.",
};

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Card" },
  { icon: Landmark, label: "Bank transfer" },
  { icon: Smartphone, label: "USSD" },
];

function payErrorMessage(code: string): string {
  switch (code) {
    case ErrorCode.TICKET_NOT_PAYABLE:
      return "This hold can no longer be paid for: it has ended or is already paid.";
    case ErrorCode.PAYMENT_GATEWAY_ERROR:
    case ErrorCode.PAYMENT_GATEWAY_UNAVAILABLE:
      return "Paystack isn't responding right now. Nothing was charged; please try again.";
    case ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS:
      return "We're still starting your payment. Try again in a moment.";
    case ErrorCode.NETWORK_ERROR:
      return "We couldn't reach Koncave Cinema. Check your connection and try again.";
    default:
      return "We couldn't start your payment. Please try again.";
  }
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: typeof Ticket;
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/6 text-white/70">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-white/45">{label}</dt>
        <dd className="mt-1 text-sm font-medium">{value}</dd>
      </div>
      {action}
    </div>
  );
}

function ReviewStep({
  ticket,
  onEdit,
}: {
  ticket: TicketDetail;
  onEdit: (step: FlowStep) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSession((state) => state.user);
  const hall = AUDITORIUMS.find((item) => item.tier === ticket.tier);
  const total = formatMoney(ticket.pricing.totalPayable, ticket.pricing.currency);
  const initialize = useInitializeCheckout();
  const release = useReleaseTicket();
  const [releasing, setReleasing] = useState(false);
  // This press of Pay: the key is kept until the API answers, so trying again after a dropped
  // connection returns the same Paystack payment instead of starting a second one
  const [payKey, setPayKey] = useState(newIdempotencyKey);
  // Off to Paystack: the button stays busy until the browser leaves the page
  const paying = initialize.isPending || initialize.isSuccess;

  // Back from Paystack through the browser's back button: the page is restored as it was left
  const { reset } = initialize;
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) reset();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [reset]);

  function pay() {
    initialize.mutate(
      { ticketId: ticket.id, idempotencyKey: payKey },
      {
        onSuccess: (session) => window.location.assign(session.authorizationUrl),
        onError: (caught) => {
          const error = toApiError(caught);
          if (!error.is(ErrorCode.NETWORK_ERROR, ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS)) {
            setPayKey(newIdempotencyKey());
          }
          // The hold ended or was paid elsewhere: read it again so the page shows which
          if (error.is(ErrorCode.TICKET_NOT_PAYABLE)) {
            void queryClient.invalidateQueries({ queryKey: [`/tickets/${ticket.id}`] });
          }
        },
      },
    );
  }

  async function releaseSeat() {
    setReleasing(true);
    await release.mutateAsync(ticket.id).catch(() => undefined);
    router.push(`/movies/${ticket.movieSlug}/showtimes/${ticket.showtimeId}`);
  }

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-surface-1">
        <ReviewRow
          icon={Ticket}
          label="Screening"
          value={
            <>
              {ticket.movieTitle} · {hall?.name ?? ticket.tier}
              <span className="mt-0.5 block font-mono text-xs font-normal text-white/50">
                {ticket.seatIdentifier}
              </span>
            </>
          }
        />
        {ticket.tier === "PUBLIC" && (
          <ReviewRow
            icon={ShieldCheck}
            label="Identity"
            value={
              user?.isPhoneVerified
                ? `Verified · shown in hall chat as ${user.publicScreenAlias ?? "you"}`
                : "Not verified yet"
            }
            action={
              user?.isPhoneVerified ? undefined : (
                <button
                  type="button"
                  onClick={() => onEdit("identity")}
                  className="text-sm font-semibold text-white/70 underline decoration-white/25 underline-offset-4 hover:text-foreground"
                >
                  Change
                </button>
              )
            }
          />
        )}
      </dl>

      <div className="rounded-2xl border border-white/10 bg-surface-1 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-semibold">Total to pay</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">{total}</p>
        </div>
        <p className="mt-1 text-right text-xs text-white/45">
          All fees included. Nothing added later.
        </p>
        <Button
          size="xl"
          className="mt-6 h-14 w-full text-base"
          disabled={paying || releasing}
          onClick={pay}
        >
          <Lock data-icon="inline-start" />
          {paying ? "Opening Paystack…" : `Pay ${total}`}
        </Button>
        {initialize.isError && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {payErrorMessage(toApiError(initialize.error).code)}
          </p>
        )}
        <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Ways to pay">
          {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65"
            >
              <Icon className="size-3.5" />
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs leading-relaxed text-white/45">
          Payments are processed securely by Paystack. By paying you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>
          . See our{" "}
          <Link href="/refunds" className="underline hover:text-foreground">
            refund policy
          </Link>
          .
        </p>
      </div>

      <button
        type="button"
        disabled={releasing || paying}
        onClick={() => void releaseSeat()}
        className="text-sm text-white/50 underline underline-offset-4 hover:text-foreground"
      >
        {releasing ? "Releasing your seat…" : "Cancel booking and release my seat"}
      </button>
    </div>
  );
}

function ExpiredHold({ ticket }: { ticket: TicketDetail }) {
  return (
    <div className="rounded-3xl border border-gold/30 bg-gold/5 p-8">
      <p className="font-display text-2xl font-extrabold">Your hold has expired</p>
      <p className="mt-3 max-w-md text-white/65">
        Seats are held for 10 minutes so everyone gets a fair chance. Nothing was charged. Choose
        your room again to get a fresh hold.
      </p>
      <Button asChild size="xl" className="mt-6">
        <Link href={`/movies/${ticket.movieSlug}/showtimes/${ticket.showtimeId}`}>
          Choose again
        </Link>
      </Button>
    </div>
  );
}

function CheckoutSteps({ ticket }: { ticket: TicketDetail }) {
  const user = useSession((state) => state.user);
  const [stepParam, setStep] = useQueryState("step", stepParser);
  const timeUp = useHoldExpired(ticket.lockExpiresAt ?? undefined);
  // Anything but a live hold (ended, released, cancelled) can't be paid for any more
  const expired = ticket.status !== "RESERVED" || ticket.lockExpiresAt === null || timeUp;

  const publicHall = ticket.tier === "PUBLIC";
  const verified = Boolean(user?.isPhoneVerified);
  // Public halls are verified before the hold (on the room page), so the identity step normally
  // shows as done; it stays in the list so the steps match the whole booking
  const flow: FlowStep[] = [...(publicHall ? (["identity"] as const) : []), "review"];
  const firstStep: FlowStep = publicHall && !verified ? "identity" : "review";
  const step = stepParam && flow.includes(stepParam) ? stepParam : firstStep;
  const allSteps: BookingStepId[] = ["room", ...flow];

  const goTo = (next: FlowStep) => {
    void setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14">
      <div className="min-w-0">
        <BookingSteps
          steps={allSteps}
          current={step}
          done={(item) => item === "room" || (item === "identity" && verified)}
          onSelect={(item) => {
            if (item === "identity") goTo(item);
          }}
        />
        <h1 className="mt-8 font-display text-3xl leading-tight font-black sm:text-4xl">
          {STEP_LABELS[step]}
        </h1>
        <p className="mt-2 max-w-xl text-white/60">{INTRO[step]}</p>

        <div key={step} className="mt-8 animate-rise">
          {expired ? (
            <ExpiredHold ticket={ticket} />
          ) : step === "identity" && verified ? (
            <div className="space-y-6">
              <p className="flex items-center gap-3 rounded-2xl border border-lobby/30 bg-lobby/5 p-5 text-sm">
                <Check className="size-5 shrink-0 text-lobby" />
                Your identity is verified. You appear in hall chat as{" "}
                <span className="font-semibold">{user?.publicScreenAlias}</span>.
              </p>
              <Button size="xl" onClick={() => goTo("review")}>
                Continue to review
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          ) : step === "identity" ? (
            <IdentityCheck onVerified={() => goTo("review")} />
          ) : (
            <ReviewStep ticket={ticket} onEdit={goTo} />
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-white/10 bg-surface-1 p-6">
          <p className="mb-5 text-[0.7rem] font-bold tracking-[0.28em] text-white/45 uppercase">
            Your booking
          </p>
          <OrderSummaryContent ticket={ticket} />
        </div>
      </aside>

      <SummaryBar
        label="Total to pay"
        total={formatMoney(ticket.pricing.totalPayable, ticket.pricing.currency)}
      >
        <OrderSummaryContent ticket={ticket} />
      </SummaryBar>
    </div>
  );
}

function CheckoutLoader({ ticketId }: { ticketId: string }) {
  // Rebuilt from GET /tickets/:id on every visit, so a reload or the Paystack redirect keeps it
  const { data: ticket, isPending, isError, error } = useGetTicket(ticketId);
  if (isPending) return <PageSkeleton />;
  if (isError) {
    const offline = toApiError(error).is(ErrorCode.NETWORK_ERROR);
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">
          {offline ? "We couldn’t load your booking" : "We can’t find that booking"}
        </p>
        <p className="mt-3 text-white/60">
          {offline
            ? "Check your connection and reload the page. Your hold is kept while it lasts."
            : "The hold may have ended, or it belongs to another account. Pick your showtime again to start a new one."}
        </p>
        <Button asChild size="xl" className="mt-8">
          <Link href="/showtimes">See showtimes</Link>
        </Button>
      </div>
    );
  }
  if (ticket.status === "CONFIRMED" || ticket.status === "CHECKED_IN") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">This booking is already paid</p>
        <p className="mt-3 text-white/60">Your pass for {ticket.movieTitle} is ready.</p>
        <Button asChild size="xl" className="mt-8">
          <Link href={`/dashboard/tickets/${ticket.id}`}>View your pass</Link>
        </Button>
      </div>
    );
  }
  return <CheckoutSteps ticket={ticket} />;
}

/** /checkout/[ticketId]: identity (Public halls) and review, around a held seat. */
export function CheckoutPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  return (
    <RequireSession fallback={<PageSkeleton />}>
      <CheckoutLoader ticketId={ticketId} />
    </RequireSession>
  );
}
