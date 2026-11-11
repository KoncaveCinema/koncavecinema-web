import { useMutation, useQuery } from "@tanstack/react-query";

import type { TicketTier } from "@/types/domain";

import { http } from "../http";
import { sendIdempotent } from "../idempotent";
import { pageSchema } from "../page-schema";
import {
  invitePreviewSchema,
  releasedTicketSchema,
  reservationReceiptSchema,
  suiteGuestSchema,
  ticketDetailSchema,
  type InvitePreview,
  type ReservationReceipt,
  type SuiteGuest,
  type TicketDetail,
} from "./tickets-schemas";

/*
 * Ticketing calls, one function per endpoint (koncavecinema-api docs/api: ticketing), each
 * parsing its reply, and the hooks the booking pages use. Query keys start with the API path and
 * mutation keys are the API's operation names, so refetch.ts refreshes what each write changes.
 */

const ticketPage = pageSchema(ticketDetailSchema);
const suiteGuests = suiteGuestSchema.array();

/** Invite codes are shared by hand: accept any case and stray spaces */
const normaliseInviteCode = (code: string) => code.trim().toUpperCase();

export interface ReserveInput {
  showtimeId: string;
  tier: TicketTier;
  /** One per intended hold: kept for a retry, replaced when the member chooses another room */
  idempotencyKey: string;
}

/** POST /tickets/reserve: holds the seat for 10 minutes */
export async function reserveTicket({
  showtimeId,
  tier,
  idempotencyKey,
}: ReserveInput): Promise<ReservationReceipt> {
  return reservationReceiptSchema.parse(
    await sendIdempotent("/tickets/reserve", { showtimeId, tier }, idempotencyKey),
  );
}

/** GET /tickets/:id: one of the member's tickets, in full */
export async function getTicket(ticketId: string): Promise<TicketDetail> {
  return ticketDetailSchema.parse(await http({ url: `/tickets/${encodeURIComponent(ticketId)}` }));
}

/** DELETE /tickets/release: gives a held seat back */
export async function releaseTicket(ticketId: string): Promise<void> {
  releasedTicketSchema.parse(
    await http({ url: "/tickets/release", method: "DELETE", data: { ticketId } }),
  );
}

/** GET /tickets/my-tickets: upcoming (soonest first) or past (newest first) */
export async function listMyTickets(when: "upcoming" | "past", page: number, pageSize: number) {
  return ticketPage.parse(
    await http({ url: "/tickets/my-tickets", params: { when, page, pageSize } }),
  );
}

/** GET /tickets/:id/guests: who has taken a seat in a host's suite. Suite host only. */
export async function listSuiteGuests(ticketId: string): Promise<SuiteGuest[]> {
  return suiteGuests.parse(await http({ url: `/tickets/${encodeURIComponent(ticketId)}/guests` }));
}

/** GET /tickets/invite/:code: what a suite guest is joining. No sign-in needed. */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const inviteCode = encodeURIComponent(normaliseInviteCode(code));
  return invitePreviewSchema.parse(await http({ url: `/tickets/invite/${inviteCode}` }));
}

/** POST /tickets/claim-invite: a suite guest takes their seat (signed in) */
export async function claimInvite(code: string): Promise<TicketDetail> {
  return ticketDetailSchema.parse(
    await http({
      url: "/tickets/claim-invite",
      method: "POST",
      data: { inviteCode: normaliseInviteCode(code) },
    }),
  );
}

/* Hooks */

export function useGetTicket(ticketId: string) {
  return useQuery({ queryKey: [`/tickets/${ticketId}`], queryFn: () => getTicket(ticketId) });
}

export function useReserveTicket() {
  return useMutation({ mutationKey: ["reserveTicket"], mutationFn: reserveTicket });
}

export function useReleaseTicket() {
  return useMutation({ mutationKey: ["releaseTicket"], mutationFn: releaseTicket });
}

export function useGetInvitePreview(code: string) {
  return useQuery({
    queryKey: [`/tickets/invite/${normaliseInviteCode(code)}`],
    queryFn: () => getInvitePreview(code),
    // An unknown code stays unknown; a rate limit asks the guest to wait
    retry: false,
  });
}

export function useClaimInvite(code: string) {
  return useMutation({ mutationKey: ["claimInvite"], mutationFn: () => claimInvite(code) });
}
