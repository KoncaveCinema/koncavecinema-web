import { cancelDemoShowtime } from "@/features/booking/demo";
import { ErrorCode, type Paginated } from "@/lib/api";
import { demoDelay, demoError } from "@/lib/demo";
import { dayKey } from "@/lib/format";
import type { TicketTier } from "@/types/domain";

import {
  isPaid,
  keptPayment,
  paginate,
  readStore,
  recordAudit,
  writeStore,
  type AdminStore,
  type DemoShowtime,
} from "../demo-store";
import type {
  AdminShowtime,
  AdminShowtimeListItem,
  ShowtimeCancellation,
  ShowtimeFilter,
  ShowtimeInput,
} from "./api-types";
import { showtimeStateAt } from "./state";

/* The showtimes demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): the API's admin showtime endpoints on
   the admin demo store, with its rules for scheduling, editing and cancelling. */

const TIERS: TicketTier[] = ["INDIVIDUAL", "PUBLIC", "PRIVATE_5", "PRIVATE_10"];
const MINUTE = 60_000;
// The API's NGN base price bounds
const MIN_NGN = 2500;
const MAX_NGN = 10000;
const round2 = (value: number) => Math.round(value * 100) / 100;

function showtimeOrThrow(store: AdminStore, id: string): DemoShowtime {
  const showtime = store.showtimes.find((item) => item.id === id);
  if (!showtime) throw demoError(ErrorCode.NOT_FOUND, `Showtime with ID '${id}' not found.`, 404);
  return showtime;
}

function filmSummary(store: AdminStore, movieId: string) {
  const film = store.films.find((item) => item.id === movieId)!;
  return { id: film.id, title: film.title, slug: film.slug, posterPortrait: film.posterPortrait };
}

const OPEN = ["RESERVED", "CONFIRMED", "CHECKED_IN"];

export async function listShowtimes(query: {
  movieId?: string;
  from?: string;
  to?: string;
  status?: ShowtimeFilter;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminShowtimeListItem>> {
  await demoDelay(300);
  const store = readStore();
  const now = Date.now();
  const rows = store.showtimes
    .filter((st) => !query.movieId || st.movieId === query.movieId)
    .filter((st) => {
      const day = dayKey(Date.parse(st.startTime));
      return (!query.from || day >= query.from) && (!query.to || day <= query.to);
    })
    .filter((st) => !query.status || showtimeStateAt(st, now) === query.status.toUpperCase())
    .sort((a, b) =>
      query.status === "upcoming"
        ? Date.parse(a.startTime) - Date.parse(b.startTime)
        : Date.parse(b.startTime) - Date.parse(a.startTime),
    )
    .map((st): AdminShowtimeListItem => {
      const passes = store.passes.filter((pass) => pass.showtimeId === st.id);
      return {
        id: st.id,
        movie: filmSummary(store, st.movieId),
        startTime: st.startTime,
        endTime: st.endTime,
        basePrice: st.basePrice,
        currency: st.currency,
        state: showtimeStateAt(st, now),
        cancelledAt: st.cancelledAt,
        cancellationReason: st.cancellationReason,
        ticketsSold: passes.filter(isPaid).length,
        activeHolds: passes.filter((pass) => pass.status === "RESERVED").length,
      };
    });
  return paginate(rows, query.page, query.pageSize);
}

export async function getShowtime(id: string): Promise<AdminShowtime> {
  await demoDelay(300);
  const store = readStore();
  const showtime = showtimeOrThrow(store, id);
  const passes = store.passes.filter((pass) => pass.showtimeId === id);
  const ids = new Set(passes.map((pass) => pass.id));
  const kept = store.payments.filter((p) => ids.has(p.ticketId) && keptPayment(p));
  const sum = (pick: (s: NonNullable<(typeof kept)[number]["settlement"]>) => number) =>
    round2(kept.reduce((total, payment) => total + pick(payment.settlement!), 0));

  return {
    id,
    movie: filmSummary(store, showtime.movieId),
    startTime: showtime.startTime,
    endTime: showtime.endTime,
    basePrice: showtime.basePrice,
    currency: showtime.currency,
    state: showtimeStateAt(showtime),
    cancelledAt: showtime.cancelledAt,
    cancellationReason: showtime.cancellationReason,
    tiers: TIERS.map((tier) => ({
      tier,
      sold: passes.filter((pass) => pass.tier === tier && isPaid(pass)).length,
      holds: passes.filter((pass) => pass.tier === tier && pass.status === "RESERVED").length,
    })),
    suites: passes
      .filter((pass) => pass.roomInviteCode)
      .map((host) => {
        const member = store.members.find((item) => item.id === host.userId)!;
        const seated = passes.filter(
          (pass) => (pass.id === host.id || pass.hostPassId === host.id) && isPaid(pass),
        );
        return {
          id: host.id,
          tier: host.tier,
          inviteCode: host.roomInviteCode!,
          seats: host.tier === "PRIVATE_5" ? 5 : 10,
          seatsTaken: seated.length,
          host: { id: member.id, email: member.email, publicScreenAlias: member.publicScreenAlias },
        };
      }),
    revenue: {
      payments: kept.length,
      gross: sum((s) => s.gross),
      gatewayFees: sum((s) => s.gatewayFee),
      producerShare: sum((s) => s.producer),
      platformShare: sum((s) => s.platform),
    },
  };
}

function checkPrice(price: number, currency: string) {
  if (currency === "NGN" && (price < MIN_NGN || price > MAX_NGN)) {
    throw demoError(
      ErrorCode.PRICE_OUT_OF_RANGE,
      `Base ticket price must be between NGN ${MIN_NGN} and NGN ${MAX_NGN}.`,
    );
  }
}

function checkStart(startTime: string) {
  if (Date.parse(startTime) <= Date.now()) {
    throw demoError(ErrorCode.SHOWTIME_START_IN_PAST, "Showtime start must be in the future.");
  }
}

export async function createShowtime(input: ShowtimeInput): Promise<{ id: string }> {
  await demoDelay();
  const store = readStore();
  const film = store.films.find((item) => item.id === input.movieId);
  if (!film) throw demoError(ErrorCode.NOT_FOUND, "Movie not found.", 404);
  if (!film.isPublished) {
    throw demoError(ErrorCode.MOVIE_NOT_PUBLISHED, "Only published films can be scheduled.");
  }
  checkStart(input.startTime);
  checkPrice(input.basePrice, input.currency ?? "NGN");
  const start = Date.parse(input.startTime);
  const showtime: DemoShowtime = {
    id: crypto.randomUUID(),
    movieId: film.id,
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + film.durationMinutes * MINUTE).toISOString(),
    basePrice: input.basePrice,
    currency: input.currency ?? "NGN",
    cancelledAt: null,
    cancellationReason: null,
  };
  store.showtimes.push(showtime);
  writeStore(store);
  return { id: showtime.id };
}

export async function updateShowtime(
  id: string,
  input: Omit<ShowtimeInput, "movieId">,
): Promise<void> {
  await demoDelay();
  const store = readStore();
  const showtime = showtimeOrThrow(store, id);
  if (showtimeStateAt(showtime) === "PAST") {
    throw demoError(ErrorCode.SHOWTIME_COMPLETED, "Cannot modify a completed screening.");
  }
  const priceChanged =
    input.basePrice !== showtime.basePrice || (input.currency ?? "NGN") !== showtime.currency;
  if (priceChanged) {
    if (store.passes.some((pass) => pass.showtimeId === id && isPaid(pass))) {
      throw demoError(
        ErrorCode.PRICE_LOCKED_AFTER_SALES,
        "The price can't change after tickets have sold.",
        409,
      );
    }
    checkPrice(input.basePrice, input.currency ?? "NGN");
  }
  if (input.startTime !== showtime.startTime) checkStart(input.startTime);
  const film = store.films.find((item) => item.id === showtime.movieId)!;
  const start = Date.parse(input.startTime);
  Object.assign(showtime, {
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + film.durationMinutes * MINUTE).toISOString(),
    basePrice: input.basePrice,
    currency: input.currency ?? "NGN",
  });
  writeStore(store);
}

/** Every hold and pass is cancelled and each payment goes on the refunds queue */
export async function cancelShowtime(id: string, reason: string): Promise<ShowtimeCancellation> {
  await demoDelay(800);
  const store = readStore();
  const showtime = showtimeOrThrow(store, id);
  if (showtime.cancelledAt) {
    throw demoError(ErrorCode.SHOWTIME_CANCELLED, "This showtime is already cancelled.", 409);
  }
  if (Date.parse(showtime.startTime) <= Date.now()) {
    throw demoError(
      ErrorCode.SHOWTIME_ALREADY_STARTED,
      "This screening has started; it can no longer be cancelled.",
    );
  }
  const now = new Date().toISOString();
  showtime.cancelledAt = now;
  showtime.cancellationReason = reason;

  const affected = store.passes.filter(
    (pass) => pass.showtimeId === id && OPEN.includes(pass.status),
  );
  let refundsQueued = 0;
  let refundTotal = 0;
  for (const pass of affected) {
    pass.status = "CANCELLED";
    const payment = store.payments.find(
      (item) => item.ticketId === pass.id && item.status === "SUCCESS",
    );
    if (payment && !payment.refundRequiredAt) {
      payment.refundRequiredAt = now;
      payment.refundRequiredReason = "SHOWTIME_CANCELLED";
      refundsQueued++;
      refundTotal += payment.amount;
    }
  }
  recordAudit(store, "ADMIN_SHOWTIME_CANCELLED", {
    showtimeId: id,
    reason,
    passesCancelled: affected.length,
  });
  writeStore(store);
  // The member's own demo passes in this tab follow, as the API's single database would
  cancelDemoShowtime(id, reason);

  return {
    id,
    cancelledAt: now,
    passesCancelled: affected.length,
    refundsQueued,
    refundTotal: round2(refundTotal),
    currency: showtime.currency,
  };
}
