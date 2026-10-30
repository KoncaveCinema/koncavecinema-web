"use client";

import { useQuery } from "@tanstack/react-query";

import { useSignedIn } from "@/features/auth/require-session";
import { getTicket, listMyTickets, listSuiteGuests } from "@/features/booking/service";

/*
 * The dashboard's server data. Keys come from one factory, so a change (a payment confirmed, a
 * pass cancelled) invalidates exactly the lists and passes it touches. The ticket key is the
 * same one checkout and confirmation use, so they share the cached pass.
 */

export type TicketsWhen = "upcoming" | "past";

export const dashboardKeys = {
  tickets: (when: TicketsWhen, page: number) => ["my-tickets", when, page] as const,
  ticket: (ticketId: string) => ["ticket", ticketId] as const,
  guests: (ticketId: string) => ["ticket", ticketId, "guests"] as const,
};

/* Every query waits for a signed-in member: until then it stays pending (the pages show their
   skeletons) and nothing is requested without a session. */

export function useMyTickets(when: TicketsWhen, page = 1) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.tickets(when, page),
    queryFn: () => listMyTickets(when, page),
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
