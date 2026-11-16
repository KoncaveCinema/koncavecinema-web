import { z } from "zod";

import { pageSchema } from "../page-schema";
import { paymentStatusSchema } from "../payments/payments-schemas";
import { ticketTierSchema } from "../showtimes/showtimes-schemas";
import { ticketStatusSchema } from "../tickets/tickets-schemas";

/*
 * The admin money replies the console reads (overview, sales, payments, refunds), checked
 * against koncavecinema-api's openapi.json (dev, 258ce4f).
 */

/** Kept revenue over a period: settled payments not owed back, one per paid pass */
const salesWindowSchema = z.object({
  passesSold: z.number(),
  gross: z.number(),
  platformShare: z.number(),
  producerShare: z.number(),
});
export type AdminSalesWindow = z.infer<typeof salesWindowSchema>;

export const publishRequirementSchema = z.enum([
  "certificate",
  "master video",
  "trailer",
  "posters",
]);
export type PublishRequirement = z.infer<typeof publishRequirementSchema>;

/** GET /admin/overview. Amounts are NGN. */
export const adminOverviewSchema = z.object({
  /** Screenings starting today, Lagos time, not cancelled */
  screeningsToday: z.number(),
  /** Screenings starting in the next seven days */
  screeningsThisWeek: z.number(),
  /** Rolling windows back from now: 24 hours, 7 days and 30 days */
  sales: z.object({
    today: salesWindowSchema,
    last7Days: salesWindowSchema,
    last30Days: salesWindowSchema,
  }),
  refundsWaiting: z.object({ count: z.number(), amount: z.number() }),
  /** Uploads still UPLOADING or PROCESSING at Mux */
  videosProcessing: z.number(),
  /** Unreleased films missing anything publishing needs, newest first, at most 20 */
  filmsNeedingAttention: z.array(
    z.object({ id: z.string(), title: z.string(), missing: z.array(publishRequirementSchema) }),
  ),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

/** Why a payment is owed back */
export const refundReasonSchema = z.enum([
  "SHOWTIME_CANCELLED",
  "CANCELLED_BY_SUPPORT",
  "PAYMENT_FOR_CANCELLED_SHOWTIME",
  "DUPLICATE_PAYMENT_FOR_CONFIRMED_PASS",
  "LATE_PAYMENT_FOR_SUPERSEDED_RESERVATION",
  "AMOUNT_MISMATCH",
]);
export type RefundReason = z.infer<typeof refundReasonSchema>;

const salesTotalsShape = {
  payments: z.number(),
  gross: z.number(),
  gatewayFees: z.number(),
  vat: z.number(),
  producerShare: z.number(),
  platformShare: z.number(),
  ticketsByTier: z.record(ticketTierSchema, z.number()),
};
const salesTotalsSchema = z.object(salesTotalsShape);
export type SalesTotals = z.infer<typeof salesTotalsSchema>;

/** GET /admin/reports/sales: kept revenue between two Lagos days, per film and showtime */
export const salesReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string(),
  totals: salesTotalsSchema,
  /** Owed back in the range: left out of the totals */
  refunds: z.object({ count: z.number(), amount: z.number() }),
  movies: z.array(
    z.object({
      ...salesTotalsShape,
      id: z.string(),
      title: z.string(),
      showtimes: z.array(
        z.object({ ...salesTotalsShape, id: z.string(), startTime: z.iso.datetime() }),
      ),
    }),
  ),
});
export type SalesReport = z.infer<typeof salesReportSchema>;

/** A payment as the money screens see it (GET /admin/payments and /admin/refunds) */
export const adminPaymentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: paymentStatusSchema,
  amount: z.number(),
  currency: z.string(),
  createdAt: z.iso.datetime(),
  refund: z
    .object({
      reason: refundReasonSchema.nullable(),
      requiredAt: z.iso.datetime(),
      refundedAt: z.iso.datetime().nullable(),
      note: z.string().nullable(),
    })
    .nullable(),
  settlement: z
    .object({ producerShare: z.number(), platformShare: z.number(), gatewayFee: z.number() })
    .nullable(),
  member: z.object({ id: z.string(), email: z.string() }),
  ticket: z.object({
    id: z.string(),
    tier: ticketTierSchema,
    seatIdentifier: z.string(),
    status: ticketStatusSchema,
  }),
  showtime: z.object({
    id: z.string(),
    startTime: z.iso.datetime(),
    movie: z.object({ id: z.string(), title: z.string() }),
  }),
});
export type AdminPayment = z.infer<typeof adminPaymentSchema>;
export const adminPaymentPageSchema = pageSchema(adminPaymentSchema);
