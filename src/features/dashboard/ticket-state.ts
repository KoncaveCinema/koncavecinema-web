import type { StatusKind } from "@/components/console/status-badge";
import type { TicketDetail } from "@/features/booking/api-types";

/* What a pass is right now, and the one thing to do next with it. One function, so the
   dashboard home, the tickets list and the pass page always agree. */

/** A screening stays watchable until 15 minutes after it ends (the API's hard cutoff) */
const CUTOFF_MS = 15 * 60_000;

export type TicketPhase =
  "hold" | "hold-expired" | "upcoming" | "lobby" | "live" | "ended" | "cancelled";

export interface TicketView {
  phase: TicketPhase;
  badge: { kind: StatusKind; status: string; label: string };
  /** The primary next step, or null when there is nothing to do */
  action: { label: string; href: string } | null;
  /** True when the pass can be played now (lobby or screening) */
  watchable: boolean;
  /** A line under the badge, e.g. where a cancelled pass's money is */
  note?: string;
}

function refundNote(ticket: TicketDetail): string | undefined {
  if (ticket.refund?.state === "PENDING") return "Refund on its way";
  if (ticket.refund?.state === "REFUNDED") return "Refunded";
  return undefined;
}

export function ticketView(ticket: TicketDetail, now: number): TicketView {
  const pass = `/dashboard/tickets/${ticket.id}`;
  const watch = `/watch/${ticket.id}`;
  const start = Date.parse(ticket.startTime);
  const cutoff = Date.parse(ticket.endTime) + CUTOFF_MS;
  const showtimePage = `/movies/${ticket.movieSlug}/showtimes/${ticket.showtimeId}`;

  if (ticket.status === "CANCELLED") {
    return {
      phase: "cancelled",
      badge: { kind: "ticket", status: "CANCELLED", label: "Cancelled" },
      action: { label: "View details", href: pass },
      watchable: false,
      note: refundNote(ticket),
    };
  }

  // A hold past its time is expired, whatever the status still says (the API's own rule)
  const holdLive =
    ticket.status === "RESERVED" &&
    ticket.lockExpiresAt !== null &&
    Date.parse(ticket.lockExpiresAt) > now;
  if (ticket.status === "RESERVED" || ticket.status === "EXPIRED") {
    if (holdLive) {
      return {
        phase: "hold",
        badge: { kind: "ticket", status: "RESERVED", label: "On hold" },
        action: { label: "Continue booking", href: `/checkout/${ticket.id}` },
        watchable: false,
      };
    }
    return {
      phase: "hold-expired",
      badge: { kind: "ticket", status: "EXPIRED", label: "Hold expired" },
      action: now < start ? { label: "Book again", href: showtimePage } : null,
      watchable: false,
    };
  }

  // CONFIRMED or CHECKED_IN
  if (now >= cutoff) {
    return {
      phase: "ended",
      badge:
        ticket.status === "CHECKED_IN"
          ? { kind: "ticket", status: "CHECKED_IN", label: "Watched" }
          : { kind: "showtime", status: "PAST", label: "Ended" },
      action: { label: "View pass", href: pass },
      watchable: false,
    };
  }
  if (now >= start) {
    return {
      phase: "live",
      badge: { kind: "showtime", status: "LIVE", label: "Live now" },
      action: { label: "Watch now", href: watch },
      watchable: true,
    };
  }
  if (now >= Date.parse(ticket.lobbyOpensAt)) {
    return {
      phase: "lobby",
      badge: { kind: "ticket", status: "CONFIRMED", label: "Lobby open" },
      action: { label: "Enter lobby", href: watch },
      watchable: true,
    };
  }
  return {
    phase: "upcoming",
    badge: { kind: "ticket", status: "CONFIRMED", label: "Confirmed" },
    action: { label: "View pass", href: pass },
    watchable: false,
  };
}
