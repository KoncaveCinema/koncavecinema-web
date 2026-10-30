"use client";

import { ArrowRight, History, Ticket } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/console/page-header";
import { EmptyState, ErrorState } from "@/components/console/states";
import { Pager, UrlTabs, usePageParam, useTabParam } from "@/components/console/url-controls";
import { Button } from "@/components/ui/button";

import { useMyTickets, type TicketsWhen } from "./queries";
import { TicketCard, TicketCardSkeleton } from "./ticket-card";

const WHEN = ["upcoming", "past"] as const satisfies readonly TicketsWhen[];

const EMPTY = {
  upcoming: {
    icon: Ticket,
    title: "Nothing booked yet",
    hint: "Your holds and passes for screenings to come appear here.",
  },
  past: {
    icon: History,
    title: "No past screenings",
    hint: "Films you've watched, and passes for screenings that have ended, appear here.",
  },
};

/** /dashboard/tickets: every pass, Upcoming (soonest first) and Past (newest first). */
export function TicketsList() {
  const [when] = useTabParam("when", WHEN, "upcoming");
  const [page] = usePageParam();
  const tickets = useMyTickets(when, page);

  return (
    <>
      <PageHeader
        eyebrow="Your passes"
        title="My tickets"
        description="Holds, passes and the screenings you've watched."
      />

      <UrlTabs
        param="when"
        label="Which tickets"
        fallback="upcoming"
        tabs={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
        className="mb-6 px-0"
      />

      {tickets.isPending ? (
        <ul className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <TicketCardSkeleton />
            </li>
          ))}
        </ul>
      ) : tickets.isError ? (
        <ErrorState title="Your tickets couldn't load" onRetry={() => void tickets.refetch()} />
      ) : tickets.data.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12">
          <EmptyState
            {...EMPTY[when]}
            action={
              when === "upcoming" && (
                <Button asChild>
                  <Link href="/movies">
                    See what&rsquo;s showing
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {tickets.data.items.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard ticket={ticket} />
              </li>
            ))}
          </ul>
          <Pager meta={tickets.data.meta} className="mt-4 rounded-2xl border border-white/8" />
        </>
      )}
    </>
  );
}
