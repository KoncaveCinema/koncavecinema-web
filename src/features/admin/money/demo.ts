import { isSuperAdmin } from "@/features/auth/roles";
import { ErrorCode, type Paginated } from "@/lib/api";
import { demoDelay, demoError } from "@/lib/demo";
import { dayKey } from "@/lib/format";
import type { TicketTier } from "@/types/domain";

import {
  currentActor,
  keptPayment,
  paginate,
  readStore,
  recordAudit,
  writeStore,
  type AdminStore,
  type DemoPayment,
} from "../demo-store";
import type { AdminPayment, SalesReport, SalesTotals } from "./api-types";

/* The money demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): sales, payments and refunds from the admin
   demo store, totalled as the API totals its settlement records. */

const TIERS: TicketTier[] = ["INDIVIDUAL", "PUBLIC", "PRIVATE_5", "PRIVATE_10"];
const kobo = (value: number) => Math.round(value * 100) / 100;

function toPayment(store: AdminStore, payment: DemoPayment): AdminPayment {
  const pass = store.passes.find((item) => item.id === payment.ticketId)!;
  const showtime = store.showtimes.find((item) => item.id === pass.showtimeId)!;
  const film = store.films.find((item) => item.id === showtime.movieId)!;
  const member = store.members.find((item) => item.id === pass.userId)!;
  return {
    id: payment.id,
    reference: payment.reference,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    createdAt: payment.createdAt,
    refund: payment.refundRequiredAt
      ? {
          reason: payment.refundRequiredReason,
          requiredAt: payment.refundRequiredAt,
          refundedAt: payment.refundedAt,
          note: payment.refundNote,
        }
      : null,
    settlement: payment.settlement
      ? {
          producerShare: payment.settlement.producer,
          platformShare: payment.settlement.platform,
          gatewayFee: payment.settlement.gatewayFee,
        }
      : null,
    member: { id: member.id, email: member.email },
    ticket: {
      id: pass.id,
      tier: pass.tier,
      seatIdentifier: pass.seatIdentifier,
      status: pass.status,
    },
    showtime: {
      id: showtime.id,
      startTime: showtime.startTime,
      movie: { id: film.id, title: film.title },
    },
  };
}

const emptyTotals = (): SalesTotals => ({
  payments: 0,
  gross: 0,
  gatewayFees: 0,
  vat: 0,
  producerShare: 0,
  platformShare: 0,
  ticketsByTier: Object.fromEntries(TIERS.map((tier) => [tier, 0])) as Record<TicketTier, number>,
});

function addTo(totals: SalesTotals, payment: DemoPayment, tier: TicketTier) {
  const settlement = payment.settlement!;
  totals.payments += 1;
  totals.gross += settlement.gross;
  totals.gatewayFees += settlement.gatewayFee;
  totals.vat += settlement.vat;
  totals.producerShare += settlement.producer;
  totals.platformShare += settlement.platform;
  totals.ticketsByTier[tier] += 1;
}

const rounded = <T extends SalesTotals>(totals: T): T => ({
  ...totals,
  gross: kobo(totals.gross),
  gatewayFees: kobo(totals.gatewayFees),
  vat: kobo(totals.vat),
  producerShare: kobo(totals.producerShare),
  platformShare: kobo(totals.platformShare),
});

const inRange = (iso: string, from: string, to: string) => {
  const day = dayKey(Date.parse(iso));
  return day >= from && day <= to;
};

export async function getSalesReport(query: {
  from: string;
  to: string;
  movieId?: string;
}): Promise<SalesReport> {
  await demoDelay(400);
  const store = readStore();
  const forFilm = (payment: DemoPayment) => {
    if (!query.movieId) return true;
    const pass = store.passes.find((item) => item.id === payment.ticketId)!;
    return store.showtimes.find((item) => item.id === pass.showtimeId)?.movieId === query.movieId;
  };

  const totals = emptyTotals();
  const films = new Map<
    string,
    SalesTotals & {
      title: string;
      showtimes: Map<string, SalesTotals & { startTime: string }>;
    }
  >();

  for (const payment of store.payments) {
    if (!keptPayment(payment) || !inRange(payment.createdAt, query.from, query.to)) continue;
    if (!forFilm(payment)) continue;
    const pass = store.passes.find((item) => item.id === payment.ticketId)!;
    const showtime = store.showtimes.find((item) => item.id === pass.showtimeId)!;
    const film = store.films.find((item) => item.id === showtime.movieId)!;
    if (!films.has(film.id)) {
      films.set(film.id, { ...emptyTotals(), title: film.title, showtimes: new Map() });
    }
    const filmTotals = films.get(film.id)!;
    if (!filmTotals.showtimes.has(showtime.id)) {
      filmTotals.showtimes.set(showtime.id, { ...emptyTotals(), startTime: showtime.startTime });
    }
    for (const bucket of [totals, filmTotals, filmTotals.showtimes.get(showtime.id)!]) {
      addTo(bucket, payment, pass.tier);
    }
  }

  const owed = store.payments.filter(
    (payment) =>
      payment.refundRequiredAt &&
      inRange(payment.refundRequiredAt, query.from, query.to) &&
      forFilm(payment),
  );

  return {
    from: query.from,
    to: query.to,
    currency: "NGN",
    totals: rounded(totals),
    refunds: {
      count: owed.length,
      amount: kobo(owed.reduce((sum, payment) => sum + payment.amount, 0)),
    },
    movies: [...films.entries()]
      .map(([id, film]) => ({
        id,
        ...rounded(film),
        title: film.title,
        showtimes: [...film.showtimes.entries()]
          .map(([showtimeId, showtime]) => ({ id: showtimeId, ...rounded(showtime) }))
          .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)),
      }))
      .sort((a, b) => b.gross - a.gross),
  };
}

export async function listPayments(query: {
  status?: AdminPayment["status"];
  reference?: string;
  email?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminPayment>> {
  await demoDelay(300);
  const store = readStore();
  const reference = query.reference?.trim().toLowerCase();
  const email = query.email?.trim().toLowerCase();
  const rows = store.payments
    .filter((payment) => !query.status || payment.status === query.status)
    .filter((payment) => !reference || payment.reference.toLowerCase().includes(reference))
    .map((payment) => toPayment(store, payment))
    .filter((payment) => !email || payment.member.email.includes(email))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return paginate(rows, query.page, query.pageSize);
}

export async function listRefunds(query: {
  state: "pending" | "done";
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminPayment>> {
  await demoDelay(300);
  const store = readStore();
  const rows = store.payments
    .filter((payment) =>
      query.state === "pending"
        ? payment.refundRequiredAt && !payment.refundedAt
        : payment.refundedAt,
    )
    .sort((a, b) =>
      query.state === "pending"
        ? Date.parse(a.refundRequiredAt!) - Date.parse(b.refundRequiredAt!)
        : Date.parse(b.refundedAt!) - Date.parse(a.refundedAt!),
    )
    .map((payment) => toPayment(store, payment));
  return paginate(rows, query.page, query.pageSize);
}

export async function markRefunded(paymentId: string, note: string): Promise<AdminPayment> {
  await demoDelay(600);
  if (!isSuperAdmin(currentActor().role)) {
    throw demoError(ErrorCode.INSUFFICIENT_ROLE, "Only the super admin records refunds.", 403);
  }
  const store = readStore();
  const payment = store.payments.find((item) => item.id === paymentId);
  if (!payment) throw demoError(ErrorCode.NOT_FOUND, "Payment not found.", 404);
  if (!payment.refundRequiredAt || payment.refundedAt) {
    throw demoError(
      ErrorCode.REFUND_NOT_REQUIRED,
      payment.refundedAt
        ? "This payment has already been refunded."
        : "This payment is not waiting for a refund.",
      409,
    );
  }
  payment.status = "REFUNDED";
  payment.refundedAt = new Date().toISOString();
  payment.refundNote = note;
  recordAudit(store, "ADMIN_REFUND_RECORDED", {
    paymentId,
    reference: payment.reference,
    amount: payment.amount,
    reason: payment.refundRequiredReason,
  });
  writeStore(store);
  return toPayment(store, payment);
}
