"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CreditCard,
  Landmark,
  Lock,
  Popcorn,
  ShieldCheck,
  Smartphone,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import { IdentityCheck } from "@/features/auth/identity-check";
import { PageSkeleton, RequireSession } from "@/features/auth/require-session";
import { isDemo } from "@/features/auth/service";
import { useSession } from "@/features/auth/session";
import { useConcessionDraft } from "@/features/concessions/cart";
import { SnackPicker } from "@/features/concessions/snack-picker";
import { useConcessionQuote } from "@/features/concessions/use-quote";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatMoney } from "@/lib/format";

import { BookingSteps, STEP_LABELS, type BookingStepId } from "./booking-steps";
import { useHoldExpired } from "./hold-timer";
import { checkoutTotal, OrderSummaryContent } from "./order-summary";
import {
  demoReference,
  getCheckout,
  releaseTicket,
  snacksAvailable,
  type Checkout,
} from "./service";
import { SummaryBar } from "./summary-bar";

const FLOW_STEPS = ["identity", "snacks", "review"] as const;
type FlowStep = (typeof FLOW_STEPS)[number];
const stepParser = parseAsStringLiteral(FLOW_STEPS);

const INTRO: Record<FlowStep, string> = {
  identity:
    "Public halls are open chat rooms, so each attendee is verified once. It takes a minute.",
  snacks: "Make it a proper night in: popcorn, food and drinks at your door before the film.",
  review: "Check everything, then pay to confirm your pass.",
};

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Card" },
  { icon: Landmark, label: "Bank transfer" },
  { icon: Smartphone, label: "USSD" },
];

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
  checkout,
  onEdit,
}: {
  checkout: Checkout;
  onEdit: (step: FlowStep) => void;
}) {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const { receipt, showtime } = checkout;
  const { quote: snackQuote } = useConcessionQuote(receipt.ticketId, showtime.startTime);
  const quote = snacksAvailable ? snackQuote : null;
  const draft = useConcessionDraft(receipt.ticketId);
  const total = checkoutTotal(checkout, quote);
  const hall = AUDITORIUMS.find((item) => item.tier === receipt.tier);
  const [releasing, setReleasing] = useState(false);
  const itemCount = quote?.items.reduce((count, item) => count + item.quantity, 0) ?? 0;

  async function release() {
    setReleasing(true);
    await releaseTicket(receipt.ticketId).catch(() => undefined);
    router.push(`/movies/${showtime.movieSlug}/showtimes/${showtime.showtimeId}`);
  }

  const change = (step: FlowStep) => (
    <button
      type="button"
      onClick={() => onEdit(step)}
      className="text-sm font-semibold text-white/70 underline decoration-white/25 underline-offset-4 hover:text-foreground"
    >
      Change
    </button>
  );

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-surface-1">
        <ReviewRow
          icon={Ticket}
          label="Screening"
          value={
            <>
              {showtime.movieTitle} · {hall?.name ?? receipt.tier}
              <span className="mt-0.5 block font-mono text-xs font-normal text-white/50">
                {receipt.seatIdentifier}
              </span>
            </>
          }
        />
        {receipt.tier === "PUBLIC" && (
          <ReviewRow
            icon={ShieldCheck}
            label="Identity"
            value={
              user?.isPhoneVerified
                ? `Verified · shown in hall chat as ${user.publicScreenAlias ?? "you"}`
                : "Not verified yet"
            }
            action={user?.isPhoneVerified ? undefined : change("identity")}
          />
        )}
        {snacksAvailable && (
          <ReviewRow
            icon={Popcorn}
            label="Snacks"
            value={
              itemCount > 0 && quote
                ? `${itemCount} ${itemCount === 1 ? "item" : "items"} to ${draft.validation?.formattedAddress ?? "your address"} · ${formatMoney(quote.totalAmount, quote.currency)}`
                : "No snacks"
            }
            action={change("snacks")}
          />
        )}
      </dl>

      <div className="rounded-2xl border border-white/10 bg-surface-1 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-semibold">Total to pay</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">
            {formatMoney(total.totalPayable, total.currency)}
          </p>
        </div>
        <p className="mt-1 text-right text-xs text-white/45">
          All fees included. Nothing added later.
        </p>
        {/* Payments are not connected yet: shown as it will be, and does nothing */}
        <Button size="xl" className="mt-6 h-14 w-full text-base">
          <Lock data-icon="inline-start" />
          Pay {formatMoney(total.totalPayable, total.currency)}
        </Button>
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
        {isDemo && (
          <p className="mt-4 text-center text-xs">
            <Link
              href={`/checkout/${receipt.ticketId}/confirmation?reference=${demoReference(receipt.ticketId)}`}
              className="text-sky-300 underline underline-offset-4"
            >
              Demo: preview the confirmation page
            </Link>
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={releasing}
        onClick={() => void release()}
        className="text-sm text-white/50 underline underline-offset-4 hover:text-foreground"
      >
        {releasing ? "Releasing your seat…" : "Cancel booking and release my seat"}
      </button>
    </div>
  );
}

function ExpiredHold({ checkout }: { checkout: Checkout }) {
  return (
    <div className="rounded-3xl border border-gold/30 bg-gold/5 p-8">
      <p className="font-display text-2xl font-extrabold">Your hold has expired</p>
      <p className="mt-3 max-w-md text-white/65">
        Seats are held for 10 minutes so everyone gets a fair chance. Nothing was charged. Choose
        your room again to get a fresh hold.
      </p>
      <Button asChild size="xl" className="mt-6">
        <Link
          href={`/movies/${checkout.showtime.movieSlug}/showtimes/${checkout.showtime.showtimeId}`}
        >
          Choose again
        </Link>
      </Button>
    </div>
  );
}

function CheckoutSteps({ checkout }: { checkout: Checkout }) {
  const user = useSession((state) => state.user);
  const [stepParam, setStep] = useQueryState("step", stepParser);
  const { receipt, showtime } = checkout;
  const { quote: snackQuote } = useConcessionQuote(receipt.ticketId, showtime.startTime);
  // Never show snacks in a total that can't include them (API mode, until concessions ship)
  const quote = snacksAvailable ? snackQuote : null;
  const draft = useConcessionDraft(receipt.ticketId);
  const expired = useHoldExpired(receipt.lockExpiresAt) || receipt.status === "EXPIRED";

  const publicHall = receipt.tier === "PUBLIC";
  const verified = Boolean(user?.isPhoneVerified);
  // Public halls are verified before the hold (on the room page), so the identity step normally
  // shows as done; it stays in the list so the steps match the whole booking
  const flow: FlowStep[] = [
    ...(publicHall ? (["identity"] as const) : []),
    ...(snacksAvailable ? (["snacks"] as const) : []),
    "review",
  ];
  const firstStep: FlowStep =
    publicHall && !verified ? "identity" : snacksAvailable ? "snacks" : "review";
  const step = stepParam && flow.includes(stepParam) ? stepParam : firstStep;
  const allSteps: BookingStepId[] = ["room", ...flow];
  const snacksDecided = draft.skipped || draft.lines.length > 0;

  const goTo = (next: FlowStep) => {
    void setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const total = checkoutTotal(checkout, quote);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14">
      <div className="min-w-0">
        <BookingSteps
          steps={allSteps}
          current={step}
          done={(item) =>
            item === "room" ||
            (item === "identity" && verified) ||
            (item === "snacks" && step === "review" && snacksDecided)
          }
          onSelect={(item) => {
            if (item === "identity" || item === "snacks") goTo(item);
          }}
        />
        <h1 className="mt-8 font-display text-3xl leading-tight font-black sm:text-4xl">
          {STEP_LABELS[step]}
        </h1>
        <p className="mt-2 max-w-xl text-white/60">{INTRO[step]}</p>

        <div key={step} className="mt-8 animate-rise">
          {expired ? (
            <ExpiredHold checkout={checkout} />
          ) : step === "identity" && verified ? (
            <div className="space-y-6">
              <p className="flex items-center gap-3 rounded-2xl border border-lobby/30 bg-lobby/5 p-5 text-sm">
                <Check className="size-5 shrink-0 text-lobby" />
                Your identity is verified. You appear in hall chat as{" "}
                <span className="font-semibold">{user?.publicScreenAlias}</span>.
              </p>
              <Button size="xl" onClick={() => goTo(snacksAvailable ? "snacks" : "review")}>
                {snacksAvailable ? "Continue to snacks" : "Continue to review"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          ) : step === "identity" ? (
            <IdentityCheck onVerified={() => goTo(snacksAvailable ? "snacks" : "review")} />
          ) : step === "snacks" ? (
            <SnackPicker
              ticketId={receipt.ticketId}
              showtimeStartTime={showtime.startTime}
              onDone={() => goTo("review")}
            />
          ) : (
            <ReviewStep checkout={checkout} onEdit={goTo} />
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-white/10 bg-surface-1 p-6">
          <p className="mb-5 text-[0.7rem] font-bold tracking-[0.28em] text-white/45 uppercase">
            Your booking
          </p>
          <OrderSummaryContent checkout={checkout} concessions={quote} />
        </div>
      </aside>

      <SummaryBar label="Total to pay" total={formatMoney(total.totalPayable, total.currency)}>
        <OrderSummaryContent checkout={checkout} concessions={quote} />
      </SummaryBar>
    </div>
  );
}

function CheckoutLoader({ ticketId }: { ticketId: string }) {
  // Rebuilt from GET /tickets/:id on every visit, so a reload or the Paystack redirect keeps it
  const { data, isPending, isError } = useQuery({
    queryKey: ["checkout", ticketId],
    queryFn: () => getCheckout(ticketId),
  });
  if (isPending) return <PageSkeleton />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">We can&rsquo;t find that booking</p>
        <p className="mt-3 text-white/60">
          The hold may have ended, or it belongs to another session. Pick your showtime again to
          start a new one.
        </p>
        <Button asChild size="xl" className="mt-8">
          <Link href="/showtimes">See showtimes</Link>
        </Button>
      </div>
    );
  }
  if (data.receipt.status === "CONFIRMED" || data.receipt.status === "CHECKED_IN") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">This booking is already paid</p>
        <p className="mt-3 text-white/60">Your pass for {data.showtime.movieTitle} is ready.</p>
        <Button asChild size="xl" className="mt-8">
          <Link href={`/account/tickets/${data.receipt.ticketId}`}>View your pass</Link>
        </Button>
      </div>
    );
  }
  return <CheckoutSteps checkout={data} />;
}

/** /checkout/[ticketId]: identity (Public halls), snacks and review, around a held seat. */
export function CheckoutFlow({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  return (
    <RequireSession fallback={<PageSkeleton />}>
      <CheckoutLoader ticketId={ticketId} />
    </RequireSession>
  );
}
