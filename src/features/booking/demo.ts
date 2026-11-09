import { useSession } from "@/features/auth/session";
import type { ShowtimeCapacity } from "@/api/showtimes/showtimes-schemas";
import { buildFixtureCatalog } from "@/features/catalog/fixture-films";
import { fixturePricing } from "@/features/catalog/fixture-pricing";
import { ApiError, ErrorCode, type Paginated } from "@/api";
import { demoDelay, demoError, readDemoStore, writeDemoStore } from "@/lib/demo";
import { lobbyOpensAt, watchableUntil } from "@/lib/screening-window";
import type { TicketTier } from "@/types/domain";

import type {
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
 * The booking demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): each endpoint as the API answers it, from
 * holds, passes and invites kept in this browser tab. Nothing is ever charged.
 */

const HOLD_SECONDS = 600;

/** The demo's stand-in for Paystack's return reference */
export const demoReference = (ticketId: string) => `DEMO-${ticketId.slice(0, 8).toUpperCase()}`;

/* ------------------------------------------------------------------------------------------ */
/* Demo store (fixtures mode only)                                                            */
/* ------------------------------------------------------------------------------------------ */

const SHOWTIMES_KEY = "kc-demo-showtimes";
const DEMO_KEY = "kc-demo-bookings";

interface DemoShowtime {
  capacity: ShowtimeCapacity;
  posterPortrait: string;
  posterLandscape: string;
}

/**
 * Demo only: the room page hands the demo its showtime and prices, standing in for the API's own
 * database. With the API connected this does nothing; nothing is stored in the browser.
 */
export function rememberShowtime(
  capacity: ShowtimeCapacity,
  posters: { posterPortrait: string; posterLandscape: string },
) {
  const store = readDemoStore<Record<string, DemoShowtime>>(SHOWTIMES_KEY, {});
  store[capacity.showtimeId] = { capacity, ...posters };
  writeDemoStore(SHOWTIMES_KEY, store);
}

const demoShowtime = (showtimeId: string) =>
  readDemoStore<Record<string, DemoShowtime>>(SHOWTIMES_KEY, {})[showtimeId] ?? null;

/** A pass as stored; its end of access is worked out on every read, as the API serves it */
type StoredDetail = Omit<TicketDetail, "accessEndsAt">;

interface DemoTicket {
  detail: StoredDetail;
  /** Set for a guest's pass, claimed from a host's invite */
  claimedFrom?: string;
  /** Another member's pass (a seeded suite guest): never listed or opened as yours */
  foreign?: { alias: string | null };
}

const SEEDED_KEY = "kc-demo-seeded";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The demo's starting passes, so every state of the dashboard can be reviewed at once: a hold
 * in progress, a screening live now, a lobby open now, a suite with guests, a screening next week, watched screenings
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
        lobbyOpensAt: lobbyOpensAt({ startTime: iso(start) }),
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

  add({ slug: "ember-and-ash", showtime: 0, tier: "INDIVIDUAL", status: "CHECKED_IN" });
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
  // Holds that ended for screenings still to come: in Past, with Book again
  add({
    slug: "the-family-meeting",
    showtime: 0,
    tier: "INDIVIDUAL",
    status: "CANCELLED",
    cancellation: { reason: "RELEASED_BY_MEMBER", message: null, cancelledAt: iso(now - DAY) },
  });
  add({
    slug: "starlight-over-kaduna",
    showtime: 0,
    tier: "PUBLIC",
    status: "CANCELLED",
    cancellation: { reason: "HOLD_EXPIRED", message: null, cancelledAt: iso(now - 3 * HOUR) },
  });
  // Paid twice for one pass: the pass stands, and the second payment is owed back
  add({
    slug: "house-of-amina",
    showtime: 0,
    tier: "INDIVIDUAL",
    status: "CONFIRMED",
    refund: "PENDING",
  });
  return tickets;
}

/** The demo's passes, seeded once per demo session (see `seedDemoPasses`). */
function readDemo(): Record<string, DemoTicket> {
  const tickets = readDemoStore<Record<string, DemoTicket>>(DEMO_KEY, {});
  if (readDemoStore(SEEDED_KEY, false)) return tickets;
  const seeded = { ...seedDemoPasses(), ...tickets };
  writeDemoStore(SEEDED_KEY, true);
  writeDemoStore(DEMO_KEY, seeded);
  return seeded;
}

const writeDemo = (tickets: Record<string, DemoTicket>) => writeDemoStore(DEMO_KEY, tickets);
function nextPassNumber(tickets: Record<string, DemoTicket>): string {
  return `PASS-${String(Object.keys(tickets).length + 1).padStart(6, "0")}`;
}

function inviteCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(5)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  );
  return `VIP-${hex.join("").toUpperCase()}`;
}

/**
 * Holds expire after 10 minutes; reading a demo ticket applies that rule as the API does: the
 * pass is cancelled with HOLD_EXPIRED (the API never sets status EXPIRED today).
 */
function withExpiry(ticket: DemoTicket): DemoTicket {
  const { detail } = ticket;
  if (detail.status === "RESERVED" && Date.parse(detail.lockExpiresAt ?? "") < Date.now()) {
    return {
      ...ticket,
      detail: {
        ...detail,
        status: "CANCELLED",
        lockExpiresAt: null,
        cancellation: { reason: "HOLD_EXPIRED", message: null, cancelledAt: detail.lockExpiresAt! },
      },
    };
  }
  return ticket;
}

const holdExpired = (detail: StoredDetail) => detail.cancellation?.reason === "HOLD_EXPIRED";

/** Suite seats taken for a host's invite code, the host included */
function seatsTaken(tickets: Record<string, DemoTicket>, code: string): number {
  return 1 + Object.values(tickets).filter((ticket) => ticket.claimedFrom === code).length;
}

/** A demo ticket as GET /tickets/:id returns it, with its end of access and live suite counts */
function demoDetail(tickets: Record<string, DemoTicket>, ticket: DemoTicket): TicketDetail {
  const { detail } = withExpiry(ticket);
  const served = { ...detail, accessEndsAt: new Date(watchableUntil(detail)).toISOString() };
  if (!detail.isSuiteHost || !detail.roomInviteCode) return served;
  return { ...served, suiteSeatsTaken: seatsTaken(tickets, detail.roomInviteCode) };
}

/* Cancelled screenings: the admin console's demo cancels them in this tab */

const CANCELLED_KEY = "kc-demo-cancelled-showtimes";

/** As the API refuses members: a cancelled screening can't be booked, joined or paid for */
function refuseCancelled(showtimeId: string) {
  if (readDemoStore<string[]>(CANCELLED_KEY, []).includes(showtimeId)) {
    throw demoError(ErrorCode.SHOWTIME_CANCELLED, "This screening has been cancelled.");
  }
}

/**
 * Demo only: a showtime cancelled from the admin console. The member's passes for it are
 * cancelled with the reason staff gave, and a paid one is owed back, as the API would record.
 */
export function cancelDemoShowtime(showtimeId: string, message: string) {
  writeDemoStore(CANCELLED_KEY, [...readDemoStore<string[]>(CANCELLED_KEY, []), showtimeId]);
  const tickets = readDemo();
  const cancelledAt = new Date().toISOString();
  for (const ticket of Object.values(tickets)) {
    const { detail } = ticket;
    if (detail.showtimeId !== showtimeId) continue;
    if (!["RESERVED", "CONFIRMED", "CHECKED_IN"].includes(detail.status)) continue;
    const paid = detail.status !== "RESERVED";
    ticket.detail = {
      ...detail,
      status: "CANCELLED",
      lockExpiresAt: null,
      cancellation: { reason: "SHOWTIME_CANCELLED", message, cancelledAt },
      refund: paid
        ? {
            state: "PENDING",
            amount: detail.purchasePrice,
            currency: detail.currency,
            refundedAt: null,
          }
        : null,
    };
  }
  writeDemo(tickets);
}

/* Endpoints, in the API's place */

export async function reserveTicket(
  showtimeId: string,
  tier: TicketTier,
): Promise<ReservationReceipt> {
  await demoDelay();
  refuseCancelled(showtimeId);
  const showtime = demoShowtime(showtimeId);
  const pricing = showtime?.capacity.tiers.find((item) => item.tier === tier)?.pricing;
  if (!showtime || !pricing) {
    throw demoError(ErrorCode.NOT_FOUND, "That showtime is no longer available.", 404);
  }
  const { capacity } = showtime;
  if (Date.parse(capacity.endTime) < Date.now()) {
    throw demoError(ErrorCode.SCREENING_CONCLUDED, "This screening has ended.", 409);
  }
  if (tier === "PUBLIC" && !useSession.getState().user?.isPhoneVerified) {
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
  const detail: StoredDetail = {
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
    lobbyOpensAt: lobbyOpensAt(capacity),
    isSuiteHost: suite,
    roomInviteCode: code,
    suiteSeats: suite ? pricing.seatCount : null,
    suiteSeatsTaken: suite ? 1 : null,
    cancellation: null,
    refund: null,
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

export async function getTicket(ticketId: string): Promise<TicketDetail> {
  await demoDelay(200);
  const tickets = readDemo();
  const stored = tickets[ticketId];
  // Another member's pass answers as the API would for someone else's: not found
  if (!stored || stored.foreign) throw demoError(ErrorCode.NOT_FOUND, "Ticket not found.", 404);
  return demoDetail(tickets, stored);
}

/** As the API: the hold is cancelled as released by the member, and the pass stays in Past */
export async function releaseTicket(ticketId: string): Promise<ReleaseTicketResponse> {
  const tickets = readDemo();
  const stored = tickets[ticketId];
  if (stored && stored.detail.status === "RESERVED") {
    stored.detail = {
      ...stored.detail,
      status: "CANCELLED",
      lockExpiresAt: null,
      cancellation: {
        reason: "RELEASED_BY_MEMBER",
        message: null,
        cancelledAt: new Date().toISOString(),
      },
    };
  }
  writeDemo(tickets);
  return { message: "Reservation released.", ticketId };
}

export async function verifyPayment(
  reference: string,
  ticketId: string,
): Promise<PaymentVerification> {
  await demoDelay(900);
  const tickets = readDemo();
  const stored = tickets[ticketId];
  if (!stored) throw demoError(ErrorCode.NOT_FOUND, "Payment not found.", 404);
  refuseCancelled(stored.detail.showtimeId);
  const ticket = withExpiry(stored);
  const amountPaid = ticket.detail.pricing.totalPayable;
  // Paid after the hold lapsed: money moved but no seat is confirmed
  if (holdExpired(ticket.detail)) {
    return {
      reference,
      status: "SUCCESS",
      ticketId,
      amountPaid,
      currency: ticket.detail.currency,
      outcome: "REFUND_PENDING",
      ticketStatus: "CANCELLED",
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

export async function listMyTickets(
  when: "upcoming" | "past" | "all",
  page: number,
  pageSize: number,
): Promise<Paginated<TicketDetail>> {
  await demoDelay(250);
  const tickets = readDemo();
  const now = Date.now();
  const all = Object.values(tickets)
    .filter((ticket) => !ticket.foreign)
    .map((ticket) => demoDetail(tickets, ticket));
  // As the API (its 1.5): every pass in exactly one tab. Upcoming: paid passes still watchable,
  // and holds within their 10 minutes (a lapsed one is already cancelled when read). Past:
  // everything else, cancelled ones included even when the screening is still to come.
  const usable = (ticket: TicketDetail) =>
    ticket.status === "RESERVED" ||
    (["CONFIRMED", "CHECKED_IN"].includes(ticket.status) && watchableUntil(ticket) > now);
  const items =
    when === "upcoming"
      ? all.filter(usable).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      : when === "past"
        ? all
            .filter((ticket) => !usable(ticket))
            .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime))
        : all.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    meta: {
      page: current,
      pageSize,
      total: items.length,
      totalPages,
      hasNextPage: current < totalPages,
      hasPreviousPage: current > 1,
      nextPage: current < totalPages ? current + 1 : null,
      previousPage: current > 1 ? current - 1 : null,
    },
  };
}

export async function listSuiteGuests(ticketId: string): Promise<SuiteGuest[]> {
  await demoDelay(250);
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

export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const inviteCode = code.trim().toUpperCase();
  await demoDelay(250);
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

export async function claimInvite(code: string): Promise<TicketDetail> {
  const inviteCode = code.trim().toUpperCase();
  await demoDelay();
  const tickets = readDemo();
  const host = Object.values(tickets).find(
    (ticket) => ticket.detail.roomInviteCode === inviteCode && !ticket.claimedFrom,
  );
  if (host) refuseCancelled(host.detail.showtimeId);
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
  const detail: StoredDetail = {
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
  return demoDetail(tickets, tickets[id]);
}
