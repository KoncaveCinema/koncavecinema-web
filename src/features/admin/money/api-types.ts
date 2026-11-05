import type { PaymentStatus, TicketStatus } from "@/features/booking/api-types";
import type { TicketTier } from "@/types/domain";

/** koncavecinema-api admin money shapes, field for field (src/admin/money.service.ts). */

/** Why a payment is owed back */
export type RefundReason =
  | "SHOWTIME_CANCELLED"
  | "CANCELLED_BY_SUPPORT"
  | "PAYMENT_FOR_CANCELLED_SHOWTIME"
  | "DUPLICATE_PAYMENT_FOR_CONFIRMED_PASS"
  | "LATE_PAYMENT_FOR_SUPERSEDED_RESERVATION"
  | "AMOUNT_MISMATCH";

export interface SalesTotals {
  payments: number;
  gross: number;
  gatewayFees: number;
  vat: number;
  producerShare: number;
  platformShare: number;
  ticketsByTier: Record<TicketTier, number>;
}

/** GET /admin/reports/sales: kept revenue between two Lagos days, per film and showtime */
export interface SalesReport {
  from: string;
  to: string;
  currency: string;
  totals: SalesTotals;
  /** Owed back in the range: left out of the totals */
  refunds: { count: number; amount: number };
  movies: (SalesTotals & {
    id: string;
    title: string;
    showtimes: (SalesTotals & { id: string; startTime: string })[];
  })[];
}

/** A payment as the money screens see it (GET /admin/payments and /admin/refunds) */
export interface AdminPayment {
  id: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: string;
  refund: {
    reason: RefundReason | null;
    requiredAt: string;
    refundedAt: string | null;
    note: string | null;
  } | null;
  settlement: { producerShare: number; platformShare: number; gatewayFee: number } | null;
  member: { id: string; email: string };
  ticket: { id: string; tier: TicketTier; seatIdentifier: string; status: TicketStatus };
  showtime: { id: string; startTime: string; movie: { id: string; title: string } };
}
