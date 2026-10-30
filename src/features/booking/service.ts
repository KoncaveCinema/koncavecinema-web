import type { ApiShowtimeCapacity } from "@/features/catalog/api-types";
import {
  api,
  ApiError,
  ErrorCode,
  newIdempotencyKey,
  withIdempotencyKey,
  type Paginated,
} from "@/lib/api";
import { isDemo } from "@/lib/demo";
import type { TicketTier } from "@/types/domain";

import type {
  HeldTicketDetails,
  InitializeCheckoutResponse,
  InvitePreview,
  PaymentVerification,
  ReleaseTicketResponse,
  ReservationReceipt,
  SuiteGuest,
  TicketDetail,
} from "./api-types";
import * as demo from "./demo";
import type { Checkout, CheckoutQuote } from "./types";

/*
 * Ticketing and payment calls, one function per endpoint. GET /tickets/:id is the source of truth:
 * checkout, confirmation and passes are rebuilt from it alone, so a reload or the Paystack
 * redirect never loses a booking. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the API's
 * part, returning the same shapes; its holds, passes and invites are kept for this browser tab,
 * and nothing is ever charged.
 */

/**
 * Snacks can be ordered and paid only in the demo for now: the API's concessions endpoints arrive
 * in its Phase 7. With the API connected the snacks step and every snacks line are hidden.
 */
export const snacksAvailable = isDemo;

/** The checkout view of a ticket */
export function checkoutFromTicket(ticket: TicketDetail): Checkout {
  return {
    receipt: {
      ticketId: ticket.id,
      showtimeId: ticket.showtimeId,
      tier: ticket.tier,
      seatIdentifier: ticket.seatIdentifier,
      status: ticket.status,
      expiresInSeconds: 0,
      // A ticket that is no longer held has no hold time left
      lockExpiresAt: ticket.lockExpiresAt ?? new Date(0).toISOString(),
      pricing: ticket.pricing,
      roomInviteCode: ticket.roomInviteCode,
    },
    showtime: {
      showtimeId: ticket.showtimeId,
      movieTitle: ticket.movieTitle,
      movieSlug: ticket.movieSlug,
      posterPortrait: ticket.posterPortrait,
      posterLandscape: ticket.posterLandscape,
      startTime: ticket.startTime,
      endTime: ticket.endTime,
    },
  };
}

/** The existing hold or pass a RESERVATION_ALREADY_HELD error points to, if any */
export function heldTicketFrom(error: ApiError): HeldTicketDetails | null {
  const { ticketId, status } = error.details;
  return typeof ticketId === "string" && typeof status === "string"
    ? { ticketId, status: status as HeldTicketDetails["status"] }
    : null;
}

/**
 * Demo only: the room page hands the demo its showtime and prices, standing in for the API's own
 * database. With the API connected this does nothing; nothing is stored in the browser.
 */
export function rememberShowtime(
  capacity: ApiShowtimeCapacity,
  posters: { posterPortrait: string; posterLandscape: string },
) {
  if (isDemo) demo.rememberShowtime(capacity, posters);
}

/* ------------------------------------------------------------------------------------------ */
/* Endpoints                                                                                  */
/* ------------------------------------------------------------------------------------------ */

/**
 * POST /tickets/reserve. One idempotency key per attempt, so a double tap holds one seat. A
 * request the API is still processing (RESERVATION_IN_PROGRESS) is retried once after a second.
 */
export async function reserveTicket(
  showtimeId: string,
  tier: TicketTier,
  idempotencyKey = newIdempotencyKey(),
): Promise<ReservationReceipt> {
  if (isDemo) return demo.reserveTicket(showtimeId, tier);
  const attempt = () =>
    api.post<ReservationReceipt>(
      "/tickets/reserve",
      { showtimeId, tier },
      withIdempotencyKey(idempotencyKey),
    );
  try {
    return await attempt();
  } catch (error) {
    if (!(error instanceof ApiError) || !error.is(ErrorCode.RESERVATION_IN_PROGRESS)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return attempt();
  }
}

/** GET /tickets/:id: one of the member's tickets, in full. */
export async function getTicket(ticketId: string): Promise<TicketDetail> {
  if (isDemo) return demo.getTicket(ticketId);
  return api.get<TicketDetail>(`/tickets/${ticketId}`);
}

/** The held ticket and its film, for the checkout page, rebuilt from GET /tickets/:id. */
export async function getCheckout(ticketId: string): Promise<Checkout> {
  return checkoutFromTicket(await getTicket(ticketId));
}

/** DELETE /tickets/release: gives the held seat back. */
export async function releaseTicket(ticketId: string): Promise<ReleaseTicketResponse> {
  if (isDemo) return demo.releaseTicket(ticketId);
  return api.delete<ReleaseTicketResponse>("/tickets/release", { data: { ticketId } });
}

/**
 * POST /payments/checkout/initialize. Not called yet: the Pay button is inactive until payments
 * are connected. No callback URL is sent: Paystack then returns the buyer to the API's
 * `{WEB_APP_URL}/checkout/{ticketId}/confirmation?reference=…` (a callback on any other origin
 * is refused with CALLBACK_URL_NOT_ALLOWED). Then redirect to `authorizationUrl`.
 */
export async function initializeCheckout(
  ticketId: string,
  idempotencyKey = newIdempotencyKey(),
): Promise<InitializeCheckoutResponse> {
  return api.post<InitializeCheckoutResponse>(
    "/payments/checkout/initialize",
    { ticketId },
    withIdempotencyKey(idempotencyKey),
  );
}

/** GET /payments/verify/:reference, polled after Paystack returns. Drive pages from `outcome`. */
export async function verifyPayment(
  reference: string,
  ticketId: string,
): Promise<PaymentVerification> {
  if (isDemo) return demo.verifyPayment(reference, ticketId);
  return api.get<PaymentVerification>(`/payments/verify/${reference}`);
}

/** GET /tickets/my-tickets: upcoming (soonest first), past (newest first) or all. */
export async function listMyTickets(
  when: "upcoming" | "past" | "all" = "all",
  page = 1,
  pageSize = 20,
): Promise<Paginated<TicketDetail>> {
  if (isDemo) return demo.listMyTickets(when, page, pageSize);
  return api.getPage<TicketDetail>("/tickets/my-tickets", { params: { when, page, pageSize } });
}

/** GET /tickets/:id/guests: who has taken a seat in a host's suite. Suite host only. */
export async function listSuiteGuests(ticketId: string): Promise<SuiteGuest[]> {
  if (isDemo) return demo.listSuiteGuests(ticketId);
  return api.get<SuiteGuest[]>(`/tickets/${ticketId}/guests`);
}

/** GET /tickets/invite/:code: what a suite guest is joining. No sign-in needed. */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const inviteCode = code.trim().toUpperCase();
  if (isDemo) return demo.getInvitePreview(code);
  return api.get<InvitePreview>(`/tickets/invite/${encodeURIComponent(inviteCode)}`);
}

/** POST /tickets/claim-invite: a suite guest takes their seat. Requires an account. */
export async function claimInvite(code: string): Promise<TicketDetail> {
  const inviteCode = code.trim().toUpperCase();
  if (isDemo) return demo.claimInvite(code);
  return api.post<TicketDetail>("/tickets/claim-invite", { inviteCode });
}

/* ------------------------------------------------------------------------------------------ */
/* Order total                                                                                */
/* ------------------------------------------------------------------------------------------ */

/**
 * The amount the Pay button charges. The API's checkout takes only a ticket today, so with the
 * API connected snacks are not included yet (a backend request: concessions on checkout). The
 * demo shows the combined order as it will be.
 */
export function quoteCheckout(
  receipt: ReservationReceipt,
  concessions: { totalAmount: number } | null,
): CheckoutQuote {
  const ticket = receipt.pricing;
  if (!isDemo || !concessions) {
    return {
      concessionsIncluded: false,
      totalPayable: ticket.totalPayable,
      currency: ticket.currency,
    };
  }
  return {
    concessionsIncluded: true,
    totalPayable: ticket.totalPayable + concessions.totalAmount,
    currency: ticket.currency,
  };
}
