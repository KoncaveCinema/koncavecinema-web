/** koncavecinema-api ticketing and payment shapes, field for field. */
import type { ApiPricingBreakdown } from "@/features/catalog/api-types";
import type { TicketTier } from "@/features/catalog/types";

export type TicketStatus = "RESERVED" | "CONFIRMED" | "CHECKED_IN" | "EXPIRED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

/** POST /tickets/reserve: a 10-minute hold */
export interface ReservationReceipt {
  ticketId: string;
  showtimeId: string;
  tier: TicketTier;
  /** The pass number, e.g. PASS-000001 */
  seatIdentifier: string;
  status: TicketStatus;
  expiresInSeconds: number;
  /** When the hold ends (ISO). The hold timer counts down to this, never from page load. */
  lockExpiresAt: string;
  pricing: ApiPricingBreakdown;
  /** Private suites only, e.g. VIP-AB12CD; guests claim seats with it */
  roomInviteCode?: string | null;
}

/**
 * GET /tickets/:id (owner only), items of GET /tickets/my-tickets, and POST /tickets/claim-invite.
 * The source of truth for checkout, confirmation and passes: a reload or the Paystack redirect
 * rebuilds every page from this alone.
 */
export interface TicketDetail {
  id: string;
  showtimeId: string;
  tier: TicketTier;
  seatIdentifier: string;
  purchasePrice: number;
  currency: string;
  status: TicketStatus;
  movieTitle: string;
  posterPortrait: string;
  startTime: string;
  endTime: string;
  qrAdmissionPayload: string;
  createdAt: string;
  /** The stored quote; all zero for a suite guest's free pass */
  pricing: ApiPricingBreakdown;
  /** Pending holds only. Past this moment the hold is expired, whatever `status` still says */
  lockExpiresAt: string | null;
  movieSlug: string;
  posterLandscape: string;
  /** Start minus 30 minutes */
  lobbyOpensAt: string;
  isSuiteHost: boolean;
  /** Suite host only */
  roomInviteCode: string | null;
  suiteSeats: number | null;
  /** Admitted members, the host included */
  suiteSeatsTaken: number | null;
}

/** GET /tickets/:id/guests (suite host only) */
export interface SuiteGuest {
  publicScreenAlias: string | null;
  seatIdentifier: string;
  joinedAt: string;
}

/** RESERVATION_ALREADY_HELD error details: the member's existing hold or pass */
export interface HeldTicketDetails {
  ticketId: string;
  status: TicketStatus;
}

/** DELETE /tickets/release */
export interface ReleaseTicketResponse {
  message: string;
  ticketId: string;
}

/** POST /payments/checkout/initialize */
export interface InitializeCheckoutResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  ticketId: string;
  amount: number;
  currency: string;
}

/**
 * What a payment achieved. REFUND_PENDING: money arrived but no pass was confirmed (a duplicate
 * payment, or a lapsed hold since replaced); the buyer is emailed that a refund is coming.
 */
export type PaymentOutcome = "CONFIRMED" | "PENDING" | "FAILED" | "REFUND_PENDING" | "REFUNDED";

/** GET /payments/verify/:reference */
export interface PaymentVerification {
  reference: string;
  status: PaymentStatus;
  ticketId: string;
  amountPaid: number;
  currency: string;
  outcome: PaymentOutcome;
  ticketStatus: TicketStatus;
}

/** GET /tickets/invite/:code: what a suite guest is joining, no sign-in needed */
export interface InvitePreview {
  movieTitle: string;
  movieSlug: string;
  posterLandscape: string;
  startTime: string;
  endTime: string;
  /** The host's screen alias, or "Your host" */
  hostAlias: string;
  seatsLeft: number;
  isActive: boolean;
}

/** POST /tickets/verify-access: where a pass is in the screening window */
export interface VerifyAccessResponse {
  isLive: boolean;
  isCompleted: boolean;
  isLobbyOpen: boolean;
  countdownSeconds: number;
  movieTitle: string;
  playbackOpen: boolean;
  chatRoomId: string;
  liveKitToken: string | null;
}
