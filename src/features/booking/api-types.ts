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

/** GET /tickets/:id and POST /tickets/claim-invite */
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
  // Coming to GET /tickets/:id (backend): enough to rebuild checkout and confirmation after a
  // reload or the Paystack redirect, without any browser storage
  pricing?: ApiPricingBreakdown;
  lockExpiresAt?: string | null;
  movieSlug?: string;
  posterLandscape?: string;
  lobbyOpensAt?: string;
  /** Suite hosts only */
  roomInviteCode?: string | null;
  suiteSeats?: number;
  suiteSeatsTaken?: number;
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

/** GET /payments/verify/:reference */
export type PaymentOutcome = "CONFIRMED" | "PENDING" | "FAILED" | "REFUND_PENDING";

export interface PaymentVerification {
  reference: string;
  status: PaymentStatus;
  ticketId: string;
  amountPaid: number;
  currency: string;
  /** Coming (backend): what the payment achieved. REFUND_PENDING: paid after the hold expired */
  outcome?: PaymentOutcome;
  ticketStatus?: TicketStatus;
}

/** GET /tickets/invite/:code (coming, backend): what a suite guest is joining, no sign-in */
export interface InvitePreview {
  movieTitle: string;
  movieSlug: string;
  posterLandscape: string;
  startTime: string;
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
