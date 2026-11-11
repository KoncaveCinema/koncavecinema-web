import type { TicketCancellation, TicketDetail, TicketRefund } from "@/api/tickets/tickets-schemas";
import { buildFixtureCatalog } from "@/features/catalog/fixture-films";
import { fixturePricing } from "@/features/catalog/fixture-pricing";
import { ErrorCode } from "@/api";
import { demoDelay, demoError, readDemoStore, writeDemoStore } from "@/lib/demo";
import { lobbyOpensAt, watchableUntil } from "@/lib/screening-window";
import type { TicketTier } from "@/types/domain";

/*
 * The passes the screening room and admin demos read (NEXT_PUBLIC_DATA_SOURCE=fixtures), kept in
 * this browser tab. Booking itself always uses the API; this goes with those demos (steps 6, 7).
 */

const DEMO_KEY = "kc-demo-bookings";

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

/**
 * Demo only: a showtime cancelled from the admin console. The member's passes for it are
 * cancelled with the reason staff gave, and a paid one is owed back, as the API would record.
 */
export function cancelDemoShowtime(showtimeId: string, message: string) {
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

/** GET /tickets/:id in the demo: the screening room and the admin console read passes here */
export async function getTicket(ticketId: string): Promise<TicketDetail> {
  await demoDelay(200);
  const tickets = readDemo();
  const stored = tickets[ticketId];
  // Another member's pass answers as the API would for someone else's: not found
  if (!stored || stored.foreign) throw demoError(ErrorCode.NOT_FOUND, "Ticket not found.", 404);
  return demoDetail(tickets, stored);
}
