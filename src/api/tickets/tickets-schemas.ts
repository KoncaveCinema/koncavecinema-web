import { z } from "zod";

import { pricingBreakdownSchema, ticketTierSchema } from "../showtimes/showtimes-schemas";

/*
 * The ticket replies the web app reads, checked against koncavecinema-api's openapi.json (dev,
 * 2791071): only the fields the screens use. GET /tickets/:id is the source of truth: checkout,
 * confirmation and the passes are rebuilt from it alone, so a reload or the Paystack redirect
 * never loses a booking.
 */

export const ticketStatusSchema = z.enum([
  "RESERVED",
  "CONFIRMED",
  "CHECKED_IN",
  "EXPIRED",
  "CANCELLED",
]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

/** POST /tickets/reserve: a 10-minute hold. Checkout reads the ticket itself afterwards. */
export const reservationReceiptSchema = z.object({
  ticketId: z.string(),
  status: ticketStatusSchema,
  lockExpiresAt: z.iso.datetime(),
});
export type ReservationReceipt = z.infer<typeof reservationReceiptSchema>;

/**
 * SHOWTIME_CANCELLED and CANCELLED_BY_SUPPORT are staff decisions (with `message`); the member
 * releases a hold, or it runs out (HOLD_EXPIRED: the API never sets status EXPIRED today). Null
 * for passes cancelled before reasons were recorded.
 */
export const ticketCancellationSchema = z.object({
  reason: z
    .enum([
      "SHOWTIME_CANCELLED",
      "CANCELLED_BY_SUPPORT",
      "RELEASED_BY_MEMBER",
      "HOLD_EXPIRED",
      "ACCOUNT_DELETED",
    ])
    .nullable(),
  /** What staff wrote (the two staff reasons only) */
  message: z.string().nullable(),
  cancelledAt: z.iso.datetime(),
});
export type TicketCancellation = z.infer<typeof ticketCancellationSchema>;
export type CancellationReason = NonNullable<TicketCancellation["reason"]>;

/** Money owed back for the pass, whatever caused it (a CONFIRMED pass can have one too) */
export const ticketRefundSchema = z.object({
  state: z.enum(["PENDING", "REFUNDED"]),
  amount: z.number(),
  currency: z.string(),
  refundedAt: z.iso.datetime().nullable(),
});
export type TicketRefund = z.infer<typeof ticketRefundSchema>;

/** GET /tickets/:id (owner only), items of GET /tickets/my-tickets, POST /tickets/claim-invite */
export const ticketDetailSchema = z.object({
  id: z.string(),
  showtimeId: z.string(),
  tier: ticketTierSchema,
  /** The pass number, e.g. PASS-000001 */
  seatIdentifier: z.string(),
  purchasePrice: z.number(),
  currency: z.string(),
  status: ticketStatusSchema,
  movieTitle: z.string(),
  movieSlug: z.string(),
  posterPortrait: z.string(),
  posterLandscape: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  qrAdmissionPayload: z.string(),
  createdAt: z.iso.datetime(),
  /** Start minus 30 minutes */
  lobbyOpensAt: z.iso.datetime(),
  /**
   * When this pass stops playing: the scheduled end plus 60 minutes for Individual Watch, plus
   * 15 for the hall and suites. The API's rule; never work it out from `endTime`.
   */
  accessEndsAt: z.iso.datetime(),
  /** The stored quote; all zero for a suite guest's free pass */
  pricing: pricingBreakdownSchema,
  /** Pending holds only. Past this moment the hold is over, whatever `status` still says */
  lockExpiresAt: z.iso.datetime().nullable(),
  isSuiteHost: z.boolean(),
  /** Suite host only, e.g. VIP-3F9A0C71BE; guests claim seats with it */
  roomInviteCode: z.string().nullable(),
  suiteSeats: z.number().nullable(),
  /** Admitted members, the host included */
  suiteSeatsTaken: z.number().nullable(),
  /** Why the pass was cancelled; null unless `status` is CANCELLED */
  cancellation: ticketCancellationSchema.nullable(),
  refund: ticketRefundSchema.nullable(),
});
export type TicketDetail = z.infer<typeof ticketDetailSchema>;

/** RESERVATION_ALREADY_HELD's `details`: the member's existing hold or pass */
export const heldTicketSchema = z.object({ ticketId: z.string(), status: ticketStatusSchema });
export type HeldTicket = z.infer<typeof heldTicketSchema>;

/** DELETE /tickets/release */
export const releasedTicketSchema = z.object({ ticketId: z.string() });

/** GET /tickets/:id/guests (suite host only) */
export const suiteGuestSchema = z.object({
  publicScreenAlias: z.string().nullable(),
  seatIdentifier: z.string(),
  joinedAt: z.iso.datetime(),
});
export type SuiteGuest = z.infer<typeof suiteGuestSchema>;

/** GET /tickets/invite/:code: what a suite guest is joining, no sign-in needed */
export const invitePreviewSchema = z.object({
  movieTitle: z.string(),
  movieSlug: z.string(),
  posterLandscape: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  /** The host's screen alias, or "Your host" */
  hostAlias: z.string(),
  seatsLeft: z.number(),
  isActive: z.boolean(),
});
export type InvitePreview = z.infer<typeof invitePreviewSchema>;
