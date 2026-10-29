"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  DoorOpen,
  LoaderCircle,
  Mail,
  Popcorn,
  Share2,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

import { AddToCalendar } from "@/components/cinema/add-to-calendar";
import { LocalTime } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { PageSkeleton, RequireSession } from "@/features/auth/require-session";
import { lobbyOpensAt } from "@/features/catalog/screening";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { env } from "@/env";
import { useNow } from "@/hooks/use-now";
import { ErrorCode, serverOffset, toApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";

import { getTicket, verifyPayment } from "./service";

// Paystack's webhook can lag the redirect: check every 3 seconds for up to 30 seconds
const POLL_MS = 3000;
const POLL_LIMIT = 10;

function InviteLinks({ code, seatsLeft }: { code: string; seatsLeft: number }) {
  const link = `${env.NEXT_PUBLIC_APP_URL}/invite/${code}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
      <p className="font-display text-lg font-extrabold">Invite your guests</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your suite has room for {seatsLeft} more. Share this link; each guest signs in and takes a
        seat.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
          {link}
        </code>
        <Button
          variant="glass"
          size="lg"
          className="h-12"
          onClick={() => {
            void navigator.clipboard.writeText(link).then(() => {
              setCopied(true);
              toast.success("Invite link copied");
            });
          }}
        >
          <Copy data-icon="inline-start" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild variant="glass" size="lg" className="h-12">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join my private screening on Koncave Cinema: ${link}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 data-icon="inline-start" />
            WhatsApp
          </a>
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Invite code <span className="font-mono text-foreground">{code}</span>
      </p>
    </div>
  );
}

function StatePanel({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="font-display text-3xl font-black">{title}</p>
      <div className="mt-3 space-y-2 text-white/65">{children}</div>
      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

function SupportLine({ reference }: { reference: string }) {
  return (
    <p className="text-sm text-white/50">
      Questions? Email {SUPPORT_EMAIL} with reference{" "}
      <span className="font-mono text-white/75">{reference}</span>.
    </p>
  );
}

function ConfirmationBody({ ticketId, reference }: { ticketId: string; reference: string }) {
  const now = useNow();
  const [startedAt] = useState(() => Date.now());
  const payment = useQuery({
    queryKey: ["payment", reference, ticketId],
    queryFn: () => verifyPayment(reference, ticketId),
    // Paystack's webhook can lag the redirect: poll while pending; keep retrying network errors
    refetchInterval: (query) =>
      (query.state.data?.outcome === "PENDING" && query.state.dataUpdateCount < POLL_LIMIT) ||
      (query.state.error && toApiError(query.state.error).is(ErrorCode.NETWORK_ERROR))
        ? POLL_MS
        : false,
    retry: false,
  });
  // Read in every state: whether the hold is still live, and the pass itself after a success
  const ticket = useQuery({ queryKey: ["ticket", ticketId], queryFn: () => getTicket(ticketId) });
  const detail = ticket.data;
  const lockExpiresAt = detail?.lockExpiresAt;
  const holdLive =
    detail?.status === "RESERVED" &&
    Boolean(lockExpiresAt) &&
    now !== null &&
    Date.parse(lockExpiresAt ?? "") > now + serverOffset();
  const movieSlug = detail?.movieSlug;
  const showtimeHref =
    detail && movieSlug ? "/movies/" + movieSlug + "/showtimes/" + detail.showtimeId : "/showtimes";
  const reviewHref = "/checkout/" + ticketId + "?step=review";

  if (payment.isError) {
    const error = toApiError(payment.error);
    if (error.is(ErrorCode.NETWORK_ERROR)) {
      return (
        <StatePanel title="Checking your payment">
          <p>Check your connection; we&rsquo;ll keep trying.</p>
          <SupportLine reference={reference} />
        </StatePanel>
      );
    }
    return (
      <StatePanel
        title="We couldn’t find this payment"
        actions={
          <Button asChild size="xl">
            <Link href="/showtimes">See showtimes</Link>
          </Button>
        }
      >
        <p>The link may be incomplete, or the payment belongs to another account.</p>
        <SupportLine reference={reference} />
      </StatePanel>
    );
  }

  const outcome = payment.data?.outcome;

  if (payment.isPending || outcome === "PENDING") {
    const waitingLong = now !== null && now - startedAt > POLL_MS * POLL_LIMIT;
    if (!waitingLong) {
      return (
        <div className="mx-auto max-w-lg py-16 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-brand" />
          <p className="mt-6 font-display text-2xl font-black">Confirming your payment</p>
          <p className="mt-3 text-white/65">
            This takes a few seconds. Please keep this page open.
          </p>
        </div>
      );
    }
    return (
      <StatePanel
        title="Payment not confirmed yet"
        actions={
          holdLive ? (
            <Button asChild size="xl">
              <Link href={reviewHref}>Back to checkout</Link>
            </Button>
          ) : undefined
        }
      >
        <p>If you closed the payment window, nothing was charged.</p>
        <SupportLine reference={reference} />
      </StatePanel>
    );
  }

  if (outcome === "FAILED") {
    return (
      <StatePanel
        title="Payment didn’t go through"
        actions={
          <Button asChild size="xl">
            <Link href={holdLive ? reviewHref : showtimeHref}>
              {holdLive ? "Try again" : "Choose again"}
            </Link>
          </Button>
        }
      >
        <p>
          {holdLive
            ? "Your seat is still held, so you can try again now."
            : "Your seat hold has ended. Choose your room again to get a fresh hold."}
        </p>
        <SupportLine reference={reference} />
      </StatePanel>
    );
  }

  // Money moved, but a payment that lands after the hold expired confirms no seat
  // Money arrived but no pass was confirmed (a duplicate payment, or a lapsed hold)
  if (outcome === "REFUND_PENDING" || outcome === "REFUNDED") {
    return (
      <StatePanel
        title="Your seat couldn’t be confirmed"
        actions={
          <Button asChild size="xl">
            <Link href={showtimeHref}>Choose again</Link>
          </Button>
        }
      >
        <p>
          {outcome === "REFUNDED"
            ? "We received your payment, but the seat could not be confirmed, so we have refunded you in full."
            : "We received your payment, but your hold had expired or was already paid for, so this seat could not be confirmed. We\u2019ll refund you in full and have emailed you the details."}
        </p>
        <SupportLine reference={reference} />
      </StatePanel>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-lobby/15 text-lobby">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-black uppercase sm:text-5xl">
          You&rsquo;re <span className="text-outline">in</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Payment received
          {payment.data && ` · ${formatMoney(payment.data.amountPaid, payment.data.currency)}`}.
          Your seat is confirmed and we&rsquo;ve emailed your pass.
        </p>
      </div>

      {detail ? (
        <div className="mt-10 space-y-8">
          {/* The pass, as a ticket: the main part and a tear-off stub */}
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-surface-1 sm:grid sm:grid-cols-[1fr_12rem]">
            <div>
              <div className="relative aspect-21/9">
                <Image
                  src={detail.posterLandscape}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 36rem, 100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,var(--color-surface-1)_100%)]"
                />
              </div>
              <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                <p className="text-[0.7rem] font-bold tracking-[0.28em] text-brand uppercase">
                  Admit ·{" "}
                  {AUDITORIUMS.find((hall) => hall.tier === detail.tier)?.kind ?? detail.tier}
                </p>
                <p className="mt-2 font-display text-2xl leading-tight font-extrabold sm:text-3xl">
                  {detail.movieTitle}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-white/45">Starts</dt>
                    <dd className="mt-1 font-medium">
                      <LocalTime iso={detail.startTime} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">Lobby opens</dt>
                    <dd className="mt-1 font-medium">
                      <LocalTime iso={lobbyOpensAt(detail)} format="clock" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">Room</dt>
                    <dd className="mt-1 font-medium">
                      {AUDITORIUMS.find((hall) => hall.tier === detail.tier)?.name ?? detail.tier}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-white/45">Paid</dt>
                    <dd className="mt-1 font-medium tabular-nums">
                      {formatMoney(detail.purchasePrice, detail.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-white/12 px-6 py-6 text-center sm:border-t-0 sm:border-l-2">
              <Ticket className="size-7 text-brand" />
              <p className="text-[0.65rem] font-bold tracking-[0.24em] text-white/45 uppercase">
                Pass number
              </p>
              <p className="font-mono text-lg font-semibold tracking-wider">
                {detail.seatIdentifier}
              </p>
            </div>
          </article>

          {detail.isSuiteHost && detail.roomInviteCode && (
            <InviteLinks
              code={detail.roomInviteCode}
              seatsLeft={Math.max(0, (detail.suiteSeats ?? 0) - (detail.suiteSeatsTaken ?? 1))}
            />
          )}

          <section aria-labelledby="next-title">
            <h2 id="next-title" className="font-display text-xl font-extrabold">
              What happens next
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Mail,
                  title: "Check your email",
                  body: "Your pass, the lobby time and a link back to it are on their way.",
                },
                {
                  icon: DoorOpen,
                  title: "The lobby opens",
                  body: "30 minutes before the start. Arrive early to settle in.",
                },
                {
                  icon: Popcorn,
                  title: "Watch together",
                  body: "The film starts for everyone at the same moment.",
                },
              ].map((item, index) => (
                <li key={item.title} className="rounded-2xl border border-white/8 p-5">
                  <span className="flex items-center gap-2 text-xs font-bold text-white/45">
                    <item.icon className="size-4 text-brand" />
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-white/55">{item.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap justify-center gap-3">
            {detail.movieSlug && (
              <AddToCalendar
                appearance="label"
                showtimeId={detail.showtimeId}
                title={detail.movieTitle}
                startTime={detail.startTime}
                endTime={detail.endTime}
                filmSlug={detail.movieSlug}
              />
            )}
            <Button asChild size="xl">
              <Link href={`/account/tickets/${detail.id}`}>View your pass</Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <Link href="/showtimes">Browse more showtimes</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <PageSkeleton />
        </div>
      )}
    </div>
  );
}

function ConfirmationReader({ ticketId }: { ticketId: string }) {
  const searchParams = useSearchParams();
  // Paystack returns with ?reference= (and ?trxref=, the same value)
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  if (!reference) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">No payment to confirm</p>
        <p className="mt-3 text-muted-foreground">
          This page opens after a payment. Pick a showtime to book.
        </p>
        <Button asChild size="xl" className="mt-8">
          <Link href="/showtimes">See showtimes</Link>
        </Button>
      </div>
    );
  }
  return <ConfirmationBody ticketId={ticketId} reference={reference} />;
}

/** /checkout/[ticketId]/confirmation: where Paystack returns, with ?reference= */
export function Confirmation({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  return (
    <RequireSession fallback={<PageSkeleton />}>
      <ConfirmationReader ticketId={ticketId} />
    </RequireSession>
  );
}
