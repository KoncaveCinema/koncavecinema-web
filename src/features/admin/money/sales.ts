import { roomLabel } from "@/features/admin/rooms";
import { toCsv } from "@/lib/csv";
import { dayKey, formatLagosDateTime } from "@/lib/format";
import type { TicketTier } from "@/types/domain";

import type { RefundReason, SalesReport } from "./api-types";

/* The money screens' rules: report ranges in Lagos days, the CSV accountants take away, and
   plain words for why a payment is owed back. */

const DAY = 24 * 60 * 60_000;
// The API's limit for one report
export const MAX_REPORT_DAYS = 366;
export const TIERS: TicketTier[] = ["INDIVIDUAL", "PUBLIC", "PRIVATE_5", "PRIVATE_10"];

export type SalesPreset = "today" | "7d" | "30d" | "month" | "last-month";

export const SALES_PRESETS: { value: SalesPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
];

/** A preset's first and last Lagos day, counted back from `now` */
export function presetRange(preset: SalesPreset, now: number): { from: string; to: string } {
  const today = dayKey(now);
  const [year, month] = today.split("-").map(Number) as [number, number];
  const pad = (value: number) => String(value).padStart(2, "0");
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: dayKey(now - 6 * DAY), to: today };
    case "30d":
      return { from: dayKey(now - 29 * DAY), to: today };
    case "month":
      return { from: `${year}-${pad(month)}-01`, to: today };
    case "last-month": {
      const lastYear = month === 1 ? year - 1 : year;
      const last = month === 1 ? 12 : month - 1;
      const days = new Date(Date.UTC(lastYear, last, 0)).getUTCDate();
      return { from: `${lastYear}-${pad(last)}-01`, to: `${lastYear}-${pad(last)}-${pad(days)}` };
    }
  }
}

/** What's wrong with a report range, or null when the API will take it */
export function rangeProblem(from: string, to: string): string | null {
  if (!from || !to) return "Choose both days.";
  const span = (Date.parse(to) - Date.parse(from)) / DAY;
  if (span < 0) return "The last day is before the first.";
  if (span >= MAX_REPORT_DAYS) return `A report covers at most ${MAX_REPORT_DAYS} days.`;
  return null;
}

/** The report as a spreadsheet: one row per showtime, then a row per film, then the total */
export function salesCsv(report: SalesReport): string {
  const header = [
    "Film",
    "Showtime (WAT)",
    "Payments",
    ...TIERS.map((tier) => `${roomLabel(tier)} passes`),
    `Gross (${report.currency})`,
    "Gateway fees",
    "VAT",
    "Producer share",
    "Platform share",
  ];
  const figures = (row: SalesReport["totals"]) => [
    row.payments,
    ...TIERS.map((tier) => row.ticketsByTier[tier] ?? 0),
    row.gross.toFixed(2),
    row.gatewayFees.toFixed(2),
    row.vat.toFixed(2),
    row.producerShare.toFixed(2),
    row.platformShare.toFixed(2),
  ];
  const rows = report.movies.flatMap((film) => [
    ...film.showtimes.map((showtime) => [
      film.title,
      formatLagosDateTime(showtime.startTime, { year: true }),
      ...figures(showtime),
    ]),
    [`${film.title} (all showtimes)`, "", ...figures(film)],
  ]);
  return toCsv(header, [
    ...rows,
    [`Total, ${report.from} to ${report.to}`, "", ...figures(report.totals)],
  ]);
}

export const REFUND_REASON: Record<RefundReason, string> = {
  SHOWTIME_CANCELLED: "Screening cancelled",
  CANCELLED_BY_SUPPORT: "Pass cancelled by support",
  PAYMENT_FOR_CANCELLED_SHOWTIME: "Paid after the screening was cancelled",
  DUPLICATE_PAYMENT_FOR_CONFIRMED_PASS: "Paid twice for one pass",
  LATE_PAYMENT_FOR_SUPERSEDED_RESERVATION: "Paid after the hold had lapsed",
  AMOUNT_MISMATCH: "Paid the wrong amount",
};

export const refundReasonLabel = (reason: RefundReason | null) =>
  reason ? (REFUND_REASON[reason] ?? reason) : "Owed back";
