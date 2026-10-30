import { env } from "@/env";
import { demoUserIsVerified } from "@/features/auth/service";
import type { ApiShowtimeCapacity } from "@/features/catalog/api-types";
import { buildFixtureCatalog } from "@/features/catalog/fixture-films";
import { fixturePricing } from "@/features/catalog/fixture-pricing";
import type { TicketTier } from "@/features/catalog/types";
import {
  api,
  ApiError,
  ErrorCode,
  newIdempotencyKey,
  withIdempotencyKey,
  type Paginated,
} from "@/lib/api";

import type {
  HeldTicketDetails,
  InitializeCheckoutResponse,
  InvitePreview,
  PaymentVerification,
  ReleaseTicketResponse,
  ReservationReceipt,
  SuiteGuest,
  TicketCancellation,
  TicketDetail,
  TicketRefund,
} from "./api-types";

/*
 * Ticketing and payment calls, one function per endpoint. GET /tickets/:id is the source of truth:
 * checkout, confirmation and passes are rebuilt from it alone, so a reload or the Paystack
 * redirect never loses a booking. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the API's
 * part, returning the same shapes; its holds, passes and invites are kept for this browser tab,
 * and nothing is ever charged.
 */

const demo = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";
const HOLD_SECONDS = 600;
const LOBBY_MS = 30 * 60_000;
const VIEWING_GRACE_MS = 15 * 60_000;

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

/** Everything the checkout page needs for one held ticket, derived from the ticket detail */
export interface Checkout {
  receipt: ReservationReceipt;
  showtime: ShowtimeSummary;
}

/** The checkout view of a ticket */
export function checkoutFromTicket(ticket: TicketDetail): Checkout {
  return {
    receipt: {
      ticketId: ticket.id,
      showtimeId: ticket.showtimeId,
      tier: ticket.tier,
      seatIdentifier: ticket.seatIdentifier,
      status: ticket.status,
      expiresInSeconds: 0,
      // A ticket that is no longer held has no hold time left
      lockExpiresAt: ticket.lockExpiresAt ?? new Date(0).toISOString(),
      pricing: ticket.pricing,
      roomInviteCode: ticket.roomInviteCode,
    },
    showtime: {
      showtimeId: ticket.showtimeId,
      movieTitle: ticket.movieTitle,
      movieSlug: ticket.movieSlug,
      posterPortrait: ticket.posterPortrait,
      posterLandscape: ticket.posterLandscape,
      startTime: ticket.startTime,
      endTime: ticket.endTime,
    },
  };
}

/** The existing hold or pass a RESERVATION_ALREADY_HELD error points to, if any */
export function heldTicketFrom(error: ApiError): HeldTicketDetails | null {
  const { ticketId, status } = error.details;
  return typeof ticketId === "string" && typeof status === "string"
    ? { ticketId, status: status as HeldTicketDetails["status"] }
    : null;
}

/* ------------------------------------------------------------------------------------------ */
/* Demo store (fixtures mode only)                                                            */
/* ------------------------------------------------------------------------------------------ */

const SHOWTIMES_KEY = "kc-demo-showtimes";
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
    // Storage blocked: the demo lasts until reload
  }
}

interface DemoShowtime {
  capacity: ApiShowtimeCapacity;
  posterPortrait: string;
  posterLandscape: string;
}

/**
 * Demo only: the room page hands the demo its showtime and prices, standing in for the API's own
 * database. With the API connected this does nothing; nothing is stored in the browser.
 */
export function rememberShowtime(
  capacity: ApiShowtimeCapacity,
  posters: { posterPortrait: string; posterLandscape: string },
) {
  if (!demo) return;
  const store = readStore<Record<string, DemoShowtime>>(SHOWTIMES_KEY, {});
  store[capacity.showtimeId] = { capacity, ...posters };
  writeStore(SHOWTIMES_KEY, store);
}

const demoShowtime = (showtimeId: string) =>
  readStore<Record<string, DemoShowtime>>(SHOWTIMES_KEY, {})[showtimeId] ?? null;

interface DemoTicket {
  detail: TicketDetail;
  /** Set for a guest's pass, claimed from a host's invite */
  claimedFrom?: string;
  /** Another member's pass (a seeded suite guest): never listed or opened as yours */
  foreign?: { alias: string | null };
}

const SEEDED_KEY = "kc-demo-seeded";
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * The demo's starting passes, so every state of the dashboard can be reviewed at once: a hold
 * in progress, a lobby open now, a suite with guests, a screening next week, watched screenings
 * and cancelled ones with their refunds. Upcoming ones use the sample catalogue's real
 * showtimes, so "Book again" and the watch links lead somewhere real.
 */
function seedDemoPasses(): Record<string, DemoTicket> {
  const now = Date.now();
  const films = new Map(buildFixtureCatalog(now).map((film) => [film.slug, film]));
  const tickets: Record<string, DemoTicket> = {};
  const iso = (time: number) => new Date(time).toISOString();

  function add(seed: {
    slug: string;
    /** One of the film's sample showtimes, or a moment relative to now for a past screening */
    showtime: number | { startsIn: number };
    tier: TicketTier;
    status: TicketDetail["status"];
    holdMinutesLeft?: number;
    guests?: (string | null)[];
    cancellation?: TicketCancellation;
    refund?: TicketRefund["state"];
  }) {
    const film = films.get(seed.slug)!;
    const sample = typeof seed.showtime === "number" ? film.showtimes[seed.showtime]! : null;
    const start = sample
      ? Date.parse(sample.startTime)
      : now + (seed.showtime as { startsIn: number }).startsIn;
    const pricing = fixturePricing(film.showtimes[0]?.basePrice ?? 5000, seed.tier);
    const suite = pricing.seatCount > 1;
    const code = suite ? inviteCode() : null;
    const seatIdentifier = nextPassNumber(tickets);
    const id = crypto.randomUUID();
    tickets[id] = {
      detail: {
        id,
        showtimeId: sample?.id ?? `demo-past-${seed.slug}`,
        tier: seed.tier,
        seatIdentifier,
        purchasePrice: pricing.totalPayable,
        currency: pricing.currency,
        status: seed.status,
        movieTitle: film.title,
        posterPortrait: film.posterPortrait,
        startTime: iso(start),
        endTime: iso(start + film.durationMinutes * MINUTE),
        qrAdmissionPayload: `demo:${seatIdentifier}`,
        createdAt: iso(Math.min(now, start) - 2 * DAY),
        pricing,
        lockExpiresAt: seed.holdMinutesLeft ? iso(now + seed.holdMinutesLeft * MINUTE) : null,
        movieSlug: film.slug,
        posterLandscape: film.posterLandscape,
        lobbyOpensAt: iso(start - LOBBY_MS),
        isSuiteHost: suite,
        roomInviteCode: code,
        suiteSeats: suite ? pricing.seatCount : null,
        suiteSeatsTaken: suite ? 1 + (seed.guests?.length ?? 0) : null,
        cancellation: seed.cancellation ?? null,
        refund: seed.refund
          ? {
              state: seed.refund,
              amount: pricing.totalPayable,
              currency: pricing.currency,
              refundedAt: seed.refund === "REFUNDED" ? iso(now - 6 * DAY) : null,
            }
          : null,
      },
    };
    for (const alias of seed.guests ?? []) {
      const guestId = crypto.randomUUID();
      tickets[guestId] = {
        detail: {
          ...tickets[id]!.detail,
          id: guestId,
          seatIdentifier: nextPassNumber(tickets),
          isSuiteHost: false,
          roomInviteCode: null,
          createdAt: iso(now - Math.floor(Math.random() * 20) * 60 * MINUTE),
        },
        claimedFrom: code!,
        foreign: { alias },
      };
    }
  }

  add({ slug: "lagos-after-dark", showtime: 0, tier: "INDIVIDUAL", status: "CONFIRMED" });
  add({
    slug: "love-in-seclusion",
    showtime: 0,
    tier: "PUBLIC",
    status: "RESERVED",
    holdMinutesLeft: 7,
  });
  add({
    slug: "city-of-dust",
    showtime: 0,
    tier: "PRIVATE_5",
    status: "CONFIRMED",
    guests: ["TundeWatches", null],
  });
  add({ slug: "red-soil", showtime: 0, tier: "PUBLIC", status: "CONFIRMED" });
  add({ slug: "sade", showtime: { startsIn: -3 * DAY }, tier: "PUBLIC", status: "CHECKED_IN" });
  add({
    slug: "house-of-amina",
    showtime: { startsIn: -2 * DAY },
    tier: "INDIVIDUAL",
    status: "CANCELLED",
    cancellation: {
      reason: "SHOWTIME_CANCELLED",
      message: "The producer has moved the premiere to a later date.",
      cancelledAt: iso(now - 4 * DAY),
    },
    refund: "PENDING",
  });
  add({
    slug: "the-family-meeting",
    showtime: { startsIn: -9 * DAY },
    tier: "PRIVATE_10",
    status: "CANCELLED",
    cancellation: {
      reason: "CANCELLED_BY_SUPPORT",
      message: "Cancelled at your request.",
      cancelledAt: iso(now - 11 * DAY),
    },
    refund: "REFUNDED",
  });
  add({
    slug: "starlight-over-kaduna",
    showtime: { startsIn: -12 * DAY },
    tier: "INDIVIDUAL",
    status: "CHECKED_IN",
  });
  return tickets;
}

/** The demo's passes, seeded once per demo session (see `seedDemoPasses`). */
function readDemo(): Record<string, DemoTicket> {
  const tickets = readStore<Record<string, DemoTicket>>(DEMO_KEY, {});
  if (readStore(SEEDED_KEY, false)) return tickets;
  const seeded = { ...seedDemoPasses(), ...tickets };
  writeStore(SEEDED_KEY, true);
  writeStore(DEMO_KEY, seeded);
  return seeded;
}

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
  const { detail } = ticket;
  if (detail.status === "RESERVED" && Date.parse(detail.lockExpiresAt ?? "") < Date.now()) {
    return { ...ticket, detail: { ...detail, status: "EXPIRED", lockExpiresAt: null } };
  }
  return ticket;
}

/** Suite seats taken for a host's invite code, the host included */
function seatsTaken(tickets: Record<string, DemoTicket>, code: string): number {
  return 1 + Object.values(tickets).filter((ticket) => ticket.claimedFrom === code).length;
}

/** A demo ticket as GET /tickets/:id returns it, with live suite counts */
function demoDetail(tickets: Record<string, DemoTicket>, ticket: DemoTicket): TicketDetail {
  const { detail } = withExpiry(ticket);
  if (!detail.isSuiteHost || !detail.roomInviteCode) return detail;
  return { ...detail, suiteSeatsTaken: seatsTaken(tickets, detail.roomInviteCode) };
}

/* ------------------------------------------------------------------------------------------ */
/* Endpoints                                                                                  */
/* ------------------------------------------------------------------------------------------ */

/**
 * POST /tickets/reserve. One idempotency key per attempt, so a double tap holds one seat. A
 * request the API is still processing (RESERVATION_IN_PROGRESS) is retried once after a second.
 */
export async function reserveTicket(
  showtimeId: string,
  tier: TicketTier,
  idempotencyKey = newIdempotencyKey(),
): Promise<ReservationReceipt> {
  if (!demo) {
    const attempt = () =>
      api.post<ReservationReceipt>(
        "/tickets/reserve",
        { showtimeId, tier },
        withIdempotencyKey(idempotencyKey),
      );
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof ApiError) || !error.is(ErrorCode.RESERVATION_IN_PROGRESS)) throw error;
      await wait(1000);
      return attempt();
    }
  }

  await wait();
  const showtime = demoShowtime(showtimeId);
  const pricing = showtime?.capacity.tiers.find((item) => item.tier === tier)?.pricing;
  if (!showtime || !pricing) {
    throw demoError(ErrorCode.NOT_FOUND, "That showtime is no longer available.", 404);
  }
  const { capacity } = showtime;
  if (Date.parse(capacity.endTime) < Date.now()) {
    throw demoError(ErrorCode.SCREENING_CONCLUDED, "This screening has ended.", 409);
  }
  if (tier === "PUBLIC" && !demoUserIsVerified()) {
    throw demoError(ErrorCode.KYC_REQUIRED, "Identity verification required.", 403);
  }

  const tickets = readDemo();
  // One hold or pass per member per showtime, as the API enforces
  const existing = Object.values(tickets)
    .map(withExpiry)
    .find(
      (ticket) =>
        !ticket.claimedFrom &&
        ticket.detail.showtimeId === showtimeId &&
        ["RESERVED", "CONFIRMED", "CHECKED_IN"].includes(ticket.detail.status),
    );
  if (existing) {
    throw new ApiError({
      status: 409,
      code: ErrorCode.RESERVATION_ALREADY_HELD,
      messages: ["You already have a booking for this showtime."],
      details: { ticketId: existing.detail.id, status: existing.detail.status },
    });
  }

  const ticketId = crypto.randomUUID();
  const lockExpiresAt = new Date(Date.now() + HOLD_SECONDS * 1000).toISOString();
  const seatIdentifier = nextPassNumber(tickets);
  const suite = pricing.seatCount > 1;
  const code = suite ? inviteCode() : null;
  const detail: TicketDetail = {
    id: ticketId,
    showtimeId,
    tier,
    seatIdentifier,
    purchasePrice: pricing.totalPayable,
    currency: pricing.currency,
    status: "RESERVED",
    movieTitle: capacity.movieTitle,
    posterPortrait: showtime.posterPortrait,
    startTime: capacity.startTime,
    endTime: capacity.endTime,
    qrAdmissionPayload: `demo:${seatIdentifier}`,
    createdAt: new Date().toISOString(),
    pricing,
    lockExpiresAt,
    movieSlug: capacity.movieSlug,
    posterLandscape: showtime.posterLandscape,
    lobbyOpensAt: new Date(Date.parse(capacity.startTime) - LOBBY_MS).toISOString(),
    isSuiteHost: suite,
    roomInviteCode: code,
    suiteSeats: suite ? pricing.seatCount : null,
    suiteSeatsTaken: suite ? 1 : null,
  };
  tickets[ticketId] = { detail };
  writeDemo(tickets);
  return {
    ticketId,
    showtimeId,
    tier,
    seatIdentifier,
    status: "RESERVED",
    expiresInSeconds: HOLD_SECONDS,
    lockExpiresAt,
    pricing,
    roomInviteCode: code,
  };
}

/** GET /tickets/:id: one of the member's tickets, in full. */
export async function getTicket(ticketId: string): Promise<TicketDetail> {
  if (!demo) return api.get<TicketDetail>(`/tickets/${ticketId}`);
  await wait(200);
  const tickets = readDemo();
  const stored = tickets[ticketId];
  // Another member's pass answers as the API would for someone else's: not found
  if (!stored || stored.foreign) throw demoError(ErrorCode.NOT_FOUND, "Ticket not found.", 404);
  return demoDetail(tickets, stored);
}

/** The held ticket and its film, for the checkout page, rebuilt from GET /tickets/:id. */
export async function getCheckout(ticketId: string): Promise<Checkout> {
  return checkoutFromTicket(await getTicket(ticketId));
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
 * are connected. No callback URL is sent: Paystack then returns the buyer to the API's
 * `{WEB_APP_URL}/checkout/{ticketId}/confirmation?reference=…` (a callback on any other origin
 * is refused with CALLBACK_URL_NOT_ALLOWED). Then redirect to `authorizationUrl`.
 */
export async function initializeCheckout(
  ticketId: string,
  idempotencyKey = newIdempotencyKey(),
): Promise<InitializeCheckoutResponse> {
  return api.post<InitializeCheckoutResponse>(
    "/payments/checkout/initialize",
    { ticketId },
    withIdempotencyKey(idempotencyKey),
  );
}

/** The demo's stand-in for Paystack's return reference */
export const demoReference = (ticketId: string) => `DEMO-${ticketId.slice(0, 8).toUpperCase()}`;

/** GET /payments/verify/:reference, polled after Paystack returns. Drive pages from `outcome`. */
export async function verifyPayment(
  reference: string,
  ticketId: string,
): Promise<PaymentVerification> {
  if (!demo) return api.get<PaymentVerification>(`/payments/verify/${reference}`);
  await wait(900);
  const tickets = readDemo();
  const stored = tickets[ticketId];
  if (!stored) throw demoError(ErrorCode.NOT_FOUND, "Payment not found.", 404);
  const ticket = withExpiry(stored);
  const amountPaid = ticket.detail.pricing.totalPayable;
  // Paid after the hold lapsed: money moved but no seat is confirmed
  if (ticket.detail.status === "EXPIRED") {
    return {
      reference,
      status: "SUCCESS",
      ticketId,
      amountPaid,
      currency: ticket.detail.currency,
      outcome: "REFUND_PENDING",
      ticketStatus: "EXPIRED",
    };
  }
  tickets[ticketId] = {
    ...ticket,
    detail: { ...ticket.detail, status: "CONFIRMED", lockExpiresAt: null },
  };
  writeDemo(tickets);
  return {
    reference,
    status: "SUCCESS",
    ticketId,
    amountPaid,
    currency: ticket.detail.currency,
    outcome: "CONFIRMED",
    ticketStatus: "CONFIRMED",
  };
}

/** GET /tickets/my-tickets: upcoming (soonest first), past (newest first) or all. */
export async function listMyTickets(
  when: "upcoming" | "past" | "all" = "all",
  page = 1,
  pageSize = 20,
): Promise<Paginated<TicketDetail>> {
  if (!demo) {
    return api.getPage<TicketDetail>("/tickets/my-tickets", { params: { when, page, pageSize } });
  }
  await wait(250);
  const tickets = readDemo();
  const now = Date.now();
  const all = Object.values(tickets)
    .filter((ticket) => !ticket.foreign)
    .map((ticket) => demoDetail(tickets, ticket));
  // As the API: holds and passes whose screening can still be watched (until the cutoff)
  const watchable = (ticket: TicketDetail) =>
    ["RESERVED", "CONFIRMED", "CHECKED_IN"].includes(ticket.status) &&
    Date.parse(ticket.endTime) + VIEWING_GRACE_MS > now;
  const items =
    when === "upcoming"
      ? all.filter(watchable).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      : when === "past"
        ? all
            .filter((ticket) => Date.parse(ticket.endTime) + VIEWING_GRACE_MS <= now)
            .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime))
        : all.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return {
    items,
    meta: {
      page,
      pageSize,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    },
  };
}

/** GET /tickets/:id/guests: who has taken a seat in a host's suite. Suite host only. */
export async function listSuiteGuests(ticketId: string): Promise<SuiteGuest[]> {
  if (!demo) return api.get<SuiteGuest[]>(`/tickets/${ticketId}/guests`);
  await wait(250);
  const tickets = readDemo();
  const code = tickets[ticketId]?.detail.roomInviteCode;
  if (!code) throw demoError(ErrorCode.FORBIDDEN, "Only the suite host can see guests.", 403);
  return Object.values(tickets)
    .filter((ticket) => ticket.claimedFrom === code)
    .map((ticket) => ({
      publicScreenAlias: ticket.foreign?.alias ?? null,
      seatIdentifier: ticket.detail.seatIdentifier,
      joinedAt: ticket.detail.createdAt,
    }));
}

/** GET /tickets/invite/:code: what a suite guest is joining. No sign-in needed. */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const inviteCode = code.trim().toUpperCase();
  if (!demo) return api.get<InvitePreview>(`/tickets/invite/${encodeURIComponent(inviteCode)}`);
  await wait(250);
  const tickets = readDemo();
  const host = Object.values(tickets).find(
    (ticket) => !ticket.claimedFrom && ticket.detail.roomInviteCode === inviteCode,
  );
  if (!host) throw demoError(ErrorCode.NOT_FOUND, "Invite not found.", 404);
  const { detail } = host;
  return {
    movieTitle: detail.movieTitle,
    movieSlug: detail.movieSlug,
    posterLandscape: detail.posterLandscape,
    startTime: detail.startTime,
    endTime: detail.endTime,
    hostAlias: "Your host",
    seatsLeft: Math.max(0, (detail.suiteSeats ?? 0) - seatsTaken(tickets, inviteCode)),
    isActive: detail.status === "CONFIRMED" && Date.parse(detail.endTime) > Date.now(),
  };
}

/** POST /tickets/claim-invite: a suite guest takes their seat. Requires an account. */
export async function claimInvite(code: string): Promise<TicketDetail> {
  const inviteCode = code.trim().toUpperCase();
  if (!demo) return api.post<TicketDetail>("/tickets/claim-invite", { inviteCode });
  await wait();
  const tickets = readDemo();
  const host = Object.values(tickets).find(
    (ticket) => ticket.detail.roomInviteCode === inviteCode && !ticket.claimedFrom,
  );
  if (!host || host.detail.status !== "CONFIRMED") {
    throw demoError(ErrorCode.SUITE_NOT_ACTIVE, "This invite isn't active.", 409);
  }
  if (seatsTaken(tickets, inviteCode) >= (host.detail.suiteSeats ?? 0)) {
    throw demoError(ErrorCode.SUITE_FULL, "This suite is full.", 409);
  }
  const id = crypto.randomUUID();
  const zero = { ...host.detail.pricing };
  for (const key of [
    "basePrice",
    "baseAmount",
    "infrastructureMarkup",
    "subtotal",
    "vatAmount",
    "processingFee",
    "totalPayable",
  ] as const) {
    zero[key] = 0;
  }
  const detail: TicketDetail = {
    ...host.detail,
    id,
    seatIdentifier: nextPassNumber(tickets),
    purchasePrice: 0,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
    pricing: zero,
    lockExpiresAt: null,
    isSuiteHost: false,
    roomInviteCode: null,
    suiteSeats: null,
    suiteSeatsTaken: null,
  };
  tickets[id] = { detail, claimedFrom: inviteCode };
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
