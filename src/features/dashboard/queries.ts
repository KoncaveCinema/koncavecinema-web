"use client";

import { useQuery } from "@tanstack/react-query";

import { getTicket, listMyTickets, listSuiteGuests } from "@/api/tickets/tickets-api";
import { useSignedIn } from "@/features/auth/require-session";
import { DEFAULT_PAGE_SIZE } from "@/hooks/use-pagination";

/*
 * The dashboard's server data. Keys start with the API path (see src/api/refetch.ts), so a
 * booking write (a hold, a release, a claim) refreshes the lists and passes it touches. The
 * ticket key is the same one checkout and confirmation use, so they share the cached pass.
 */

export type TicketsWhen = "upcoming" | "past";

export const dashboardKeys = {
  tickets: (when: TicketsWhen, page: number, pageSize: number) =>
    ["/tickets/my-tickets", { when, page, pageSize }] as const,
  ticket: (ticketId: string) => [`/tickets/${ticketId}`] as const,
  guests: (ticketId: string) => [`/tickets/${ticketId}/guests`] as const,
};

/* Every query waits for a signed-in member: until then it stays pending (the pages show their
   skeletons) and nothing is requested without a session. */

export function useMyTickets(when: TicketsWhen, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.tickets(when, page, pageSize),
    queryFn: () => listMyTickets(when, page, pageSize),
    enabled: signedIn,
  });
}

export function useTicket(ticketId: string) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.ticket(ticketId),
    queryFn: () => getTicket(ticketId),
    retry: false,
    enabled: signedIn,
  });
}

/** Who has joined a host's suite. Only asked for when the pass is a suite host's. */
export function useSuiteGuests(ticketId: string, enabled: boolean) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.guests(ticketId),
    queryFn: () => listSuiteGuests(ticketId),
    enabled: enabled && signedIn,
  });
}
