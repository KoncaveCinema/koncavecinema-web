import { env } from "@/env";
import type { ApiShowtimeCapacity } from "@/features/catalog/api-types";
import type { TicketTier } from "@/features/catalog/types";
import { api, ApiError, ErrorCode, newIdempotencyKey, withIdempotencyKey } from "@/lib/api";

import { demoUserIsVerified } from "@/features/auth/service";

import type {
  InitializeCheckoutResponse,
  PaymentVerification,
  ReleaseTicketResponse,
  ReservationReceipt,
  TicketDetail,
} from "./api-types";

/*
 * Ticketing and payment calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a
 * demo plays the API's part: holds, passes and suite invites are kept for this browser tab, and
 * nothing is ever charged.
 */

const demo = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";
const HOLD_SECONDS = 600;

/**
 * Snacks can be ordered and paid only in the demo for now: the API's concessions endpoints arrive
 * in its Phase 7. With the API connected the snacks step and every snacks line are hidden.
 */
export const snacksAvailable = demo;

/** Film details the checkout shows next to a hold */
export interface ShowtimeSummary {
  showtimeId: string;
  movieTitle: string;
  movieSlug: string;
  posterPortrait: string;
  posterLandscape: string;
  startTime: string;
  endTime: string;
}

/** Everything the checkout page needs for one held ticket */
export interface Checkout {
  receipt: ReservationReceipt;
  showtime: ShowtimeSummary;
}

/* ------------------------------------------------------------------------------------------ */
/* Showtime details, kept from the showtime page so checkout can show them                     */
/* ------------------------------------------------------------------------------------------ */

const SHOWTIMES_KEY = "kc-showtimes";
const DEMO_KEY = "kc-demo-bookings";

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: details last until reload
  }
}

interface RememberedShowtime extends ShowtimeSummary {
  capacity: ApiShowtimeCapacity;
}

/** Called by the showtime page: public film details and prices, nothing personal. */
export function rememberShowtime(
  capacity: ApiShowtimeCapacity,
  posters: { posterPortrait: string; posterLandscape: string },
) {
  const store = readStore<Record<string, RememberedShowtime>>(SHOWTIMES_KEY, {});
  store[capacity.showtimeId] = {
    showtimeId: capacity.showtimeId,
    movieTitle: capacity.movieTitle,
    movieSlug: capacity.movieSlug,
    startTime: capacity.startTime,
    endTime: capacity.endTime,
    ...posters,
    capacity,
  };
  writeStore(SHOWTIMES_KEY, store);
}

function rememberedShowtime(showtimeId: string): RememberedShowtime | null {
  return readStore<Record<string, RememberedShowtime>>(SHOWTIMES_KEY, {})[showtimeId] ?? null;
}

function summary(showtime: RememberedShowtime): ShowtimeSummary {
  const { capacity: _capacity, ...rest } = showtime;
  return rest;
}

/* ------------------------------------------------------------------------------------------ */
/* Demo tickets                                                                               */
/* ------------------------------------------------------------------------------------------ */

interface DemoTicket {
  receipt: ReservationReceipt;
  detail: TicketDetail;
  /** Set for a guest's pass, claimed from a host's invite */
  claimedFrom?: string;
}

const readDemo = () => readStore<Record<string, DemoTicket>>(DEMO_KEY, {});
const writeDemo = (tickets: Record<string, DemoTicket>) => writeStore(DEMO_KEY, tickets);
const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

function demoError(code: string, message: string, status = 400): ApiError {
  return new ApiError({ status, code, messages: [message] });
}

function nextPassNumber(tickets: Record<string, DemoTicket>): string {
  return `PASS-${String(Object.keys(tickets).length + 1).padStart(6, "0")}`;
}

function inviteCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  );
  return `VIP-${hex.join("").toUpperCase()}`;
}

/** Holds expire after 10 minutes; reading a demo ticket applies that rule */
function withExpiry(ticket: DemoTicket): DemoTicket {
  if (
    ticket.receipt.status === "RESERVED" &&
    Date.parse(ticket.receipt.lockExpiresAt) < Date.now()
  ) {
    return {
      ...ticket,
      receipt: { ...ticket.receipt, status: "EXPIRED" },
      detail: { ...ticket.detail, status: "EXPIRED" },
    };
  }
  return ticket;
}

/* ------------------------------------------------------------------------------------------ */
/* Endpoints                                                                                  */
/* ------------------------------------------------------------------------------------------ */

// Receipts from this page session, for checkout in API mode (the API's GET /tickets/:id does not
// return the hold's price breakdown or expiry yet: a backend request)
const receipts = new Map<string, ReservationReceipt>();

/** POST /tickets/reserve. One idempotency key per attempt, so a double tap holds one seat. */
export async function reserveTicket(
  showtimeId: string,
  tier: TicketTier,
  idempotencyKey = newIdempotencyKey(),
): Promise<ReservationReceipt> {
  if (!demo) {
    const receipt = await api.post<ReservationReceipt>(
      "/tickets/reserve",
      { showtimeId, tier },
      withIdempotencyKey(idempotencyKey),
    );
    receipts.set(receipt.ticketId, receipt);
    return receipt;
  }

  await wait();
  const showtime = rememberedShowtime(showtimeId);
  const pricing = showtime?.capacity.tiers.find((item) => item.tier === tier)?.pricing;
  if (!showtime || !pricing) {
    throw demoError(ErrorCode.NOT_FOUND, "That showtime is no longer available.", 404);
  }
  if (Date.parse(showtime.endTime) < Date.now()) {
    throw demoError(ErrorCode.SCREENING_CONCLUDED, "This screening has ended.", 409);
  }

  const tickets = readDemo();
  if (tier === "PUBLIC" && !demoUserIsVerified()) {
    throw demoError(ErrorCode.KYC_REQUIRED, "Identity verification required.", 403);
  }
  const held = Object.values(tickets)
    .map(withExpiry)
    .find(
      (ticket) => ticket.receipt.showtimeId === showtimeId && ticket.receipt.status === "RESERVED",
    );
  if (held) {
    throw new ApiError({
      status: 409,
      code: ErrorCode.RESERVATION_ALREADY_HELD,
      messages: ["You already hold a seat for this showtime."],
      details: { ticketId: held.receipt.ticketId },
    });
  }
  const ticketId = crypto.randomUUID();
  const lockExpiresAt = new Date(Date.now() + HOLD_SECONDS * 1000).toISOString();
  const seatIdentifier = nextPassNumber(tickets);
  const receipt: ReservationReceipt = {
    ticketId,
    showtimeId,
    tier,
    seatIdentifier,
    status: "RESERVED",
    expiresInSeconds: HOLD_SECONDS,
    lockExpiresAt,
    pricing,
    roomInviteCode: tier === "PRIVATE_5" || tier === "PRIVATE_10" ? inviteCode() : null,
  };
  tickets[ticketId] = {
    receipt,
    detail: {
      id: ticketId,
      showtimeId,
      tier,
      seatIdentifier,
      purchasePrice: pricing.totalPayable,
      currency: pricing.currency,
      status: "RESERVED",
      movieTitle: showtime.movieTitle,
      posterPortrait: showtime.posterPortrait,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      qrAdmissionPayload: `demo:${seatIdentifier}`,
      createdAt: new Date().toISOString(),
    },
  };
  writeDemo(tickets);
  return receipt;
}

/** The held ticket and its film, for the checkout page. Null when it can't be found. */
export async function getCheckout(ticketId: string): Promise<Checkout | null> {
  if (!demo) {
    const ticket = await api.get<TicketDetail>(`/tickets/${ticketId}`);
    const remembered = rememberedShowtime(ticket.showtimeId);
    const pricing = ticket.pricing ?? receipts.get(ticketId)?.pricing;
    const lockExpiresAt = ticket.lockExpiresAt ?? receipts.get(ticketId)?.lockExpiresAt;
    if (!pricing || !lockExpiresAt) return null;
    return {
      receipt: {
        ticketId: ticket.id,
        showtimeId: ticket.showtimeId,
        tier: ticket.tier,
        seatIdentifier: ticket.seatIdentifier,
        status: ticket.status,
        expiresInSeconds: 0,
        lockExpiresAt,
        pricing,
        roomInviteCode: ticket.roomInviteCode ?? null,
      },
      showtime: {
        showtimeId: ticket.showtimeId,
        movieTitle: ticket.movieTitle,
        movieSlug: ticket.movieSlug ?? remembered?.movieSlug ?? "",
        posterPortrait: ticket.posterPortrait,
        posterLandscape:
          ticket.posterLandscape ?? remembered?.posterLandscape ?? ticket.posterPortrait,
        startTime: ticket.startTime,
        endTime: ticket.endTime,
      },
    };
  }
  await wait(200);
  const ticket = readDemo()[ticketId];
  if (!ticket) return null;
  const showtime = rememberedShowtime(ticket.receipt.showtimeId);
  if (!showtime) return null;
  return { receipt: withExpiry(ticket).receipt, showtime: summary(showtime) };
}

/**
 * The member's live hold on a showtime, after RESERVATION_ALREADY_HELD: from the error's `ticketId`
 * when the API sends it, otherwise found in GET /tickets/my-tickets.
 */
export async function findHeldTicket(
  showtimeId: string,
  fromError?: unknown,
): Promise<string | null> {
  if (typeof fromError === "string" && fromError) return fromError;
  if (demo) {
    const held = Object.values(readDemo())
      .map(withExpiry)
      .find(
        (ticket) =>
          ticket.receipt.showtimeId === showtimeId && ticket.receipt.status === "RESERVED",
      );
    return held?.receipt.ticketId ?? null;
  }
  const page = await api.getPage<TicketDetail>("/tickets/my-tickets", {
    params: { page: 1, pageSize: 50 },
  });
  return (
    page.items.find((ticket) => ticket.showtimeId === showtimeId && ticket.status === "RESERVED")
      ?.id ?? null
  );
}

/** DELETE /tickets/release: gives the held seat back. */
export async function releaseTicket(ticketId: string): Promise<ReleaseTicketResponse> {
  if (!demo) return api.delete<ReleaseTicketResponse>("/tickets/release", { data: { ticketId } });
  const tickets = readDemo();
  delete tickets[ticketId];
  writeDemo(tickets);
  return { message: "Reservation released.", ticketId };
}

/**
 * POST /payments/checkout/initialize. Not called yet: the Pay button is inactive until payments
 * are connected. Then: redirect to `authorizationUrl`; Paystack returns to `callbackUrl`.
 */
export async function initializeCheckout(
  ticketId: string,
  callbackUrl: string,
  idempotencyKey = newIdempotencyKey(),
): Promise<InitializeCheckoutResponse> {
  return api.post<InitializeCheckoutResponse>(
    "/payments/checkout/initialize",
    { ticketId, callbackUrl },
    withIdempotencyKey(idempotencyKey),
  );
}

/** The demo's stand-in for Paystack's return reference */
export const demoReference = (ticketId: string) => `DEMO-${ticketId.slice(0, 8).toUpperCase()}`;

/** GET /payments/verify/:reference, polled after Paystack returns. */
export async function verifyPayment(
  reference: string,
  ticketId: string,
): Promise<PaymentVerification> {
  if (!demo) return api.get<PaymentVerification>(`/payments/verify/${reference}`);
  await wait(900);
  const tickets = readDemo();
  const ticket = tickets[ticketId];
  if (!ticket) throw demoError(ErrorCode.NOT_FOUND, "Payment not found.", 404);
  tickets[ticketId] = {
    ...ticket,
    receipt: { ...ticket.receipt, status: "CONFIRMED" },
    detail: { ...ticket.detail, status: "CONFIRMED" },
  };
  writeDemo(tickets);
  return {
    reference,
    status: "SUCCESS",
    ticketId,
    amountPaid: ticket.receipt.pricing.totalPayable,
    currency: ticket.receipt.pricing.currency,
    outcome: "CONFIRMED",
    ticketStatus: "CONFIRMED",
  };
}

/** GET /tickets/:id */
export async function getTicket(
  ticketId: string,
): Promise<{ ticket: TicketDetail; receipt: ReservationReceipt | null; movieSlug: string | null }> {
  if (!demo) {
    const ticket = await api.get<TicketDetail>(`/tickets/${ticketId}`);
    const remembered = receipts.get(ticketId) ?? null;
    const receipt: ReservationReceipt | null = ticket.pricing
      ? {
          ticketId: ticket.id,
          showtimeId: ticket.showtimeId,
          tier: ticket.tier,
          seatIdentifier: ticket.seatIdentifier,
          status: ticket.status,
          expiresInSeconds: 0,
          lockExpiresAt: ticket.lockExpiresAt ?? "",
          pricing: ticket.pricing,
          roomInviteCode: ticket.roomInviteCode ?? null,
        }
      : remembered;
    return { ticket, receipt, movieSlug: ticket.movieSlug ?? null };
  }
  await wait(200);
  const stored = readDemo()[ticketId];
  if (!stored) throw demoError(ErrorCode.NOT_FOUND, "Ticket not found.", 404);
  const ticket = withExpiry(stored);
  return {
    ticket: ticket.detail,
    receipt: ticket.claimedFrom ? null : ticket.receipt,
    movieSlug: rememberedShowtime(ticket.detail.showtimeId)?.movieSlug ?? null,
  };
}

/** POST /tickets/claim-invite: a suite guest takes their seat. Requires an account. */
export async function claimInvite(code: string): Promise<TicketDetail> {
  const inviteCode = code.trim().toUpperCase();
  if (!demo) return api.post<TicketDetail>("/tickets/claim-invite", { inviteCode });
  await wait();
  const tickets = readDemo();
  const host = Object.values(tickets).find(
    (ticket) => ticket.receipt.roomInviteCode === inviteCode && !ticket.claimedFrom,
  );
  if (!host || host.receipt.status !== "CONFIRMED") {
    throw demoError(ErrorCode.SUITE_NOT_ACTIVE, "This invite isn't active.", 409);
  }
  const guests = Object.values(tickets).filter((ticket) => ticket.claimedFrom === inviteCode);
  if (guests.length + 1 >= host.receipt.pricing.seatCount) {
    throw demoError(ErrorCode.SUITE_FULL, "This suite is full.", 409);
  }
  const id = crypto.randomUUID();
  const detail: TicketDetail = {
    ...host.detail,
    id,
    seatIdentifier: nextPassNumber(tickets),
    purchasePrice: 0,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };
  tickets[id] = { receipt: { ...host.receipt, ticketId: id }, detail, claimedFrom: inviteCode };
  writeDemo(tickets);
  return detail;
}

/* ------------------------------------------------------------------------------------------ */
/* Order total                                                                                */
/* ------------------------------------------------------------------------------------------ */

/** The ticket and the snacks as one order, priced by the API */
export interface CheckoutQuote {
  /** Snacks can be paid together with the ticket */
  concessionsIncluded: boolean;
  totalPayable: number;
  currency: string;
}

/**
 * The amount the Pay button charges. The API's checkout takes only a ticket today, so with the
 * API connected snacks are not included yet (a backend request: concessions on checkout). The
 * demo shows the combined order as it will be.
 */
export function quoteCheckout(
  receipt: ReservationReceipt,
  concessions: { totalAmount: number } | null,
): CheckoutQuote {
  const ticket = receipt.pricing;
  if (!demo || !concessions) {
    return {
      concessionsIncluded: false,
      totalPayable: ticket.totalPayable,
      currency: ticket.currency,
    };
  }
  return {
    concessionsIncluded: true,
    totalPayable: ticket.totalPayable + concessions.totalAmount,
    currency: ticket.currency,
  };
}
