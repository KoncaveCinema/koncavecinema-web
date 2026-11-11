import type { StatusKind } from "@/components/console/status-badge";
import type { TicketDetail } from "@/api/tickets/tickets-schemas";

/* What a pass is right now, and the one thing to do next with it. One function, so the
   dashboard home, the tickets list and the pass page always agree. */

export type TicketPhase =
  "hold" | "hold-expired" | "released" | "upcoming" | "lobby" | "live" | "ended" | "cancelled";

export interface TicketView {
  phase: TicketPhase;
  badge: { kind: StatusKind; status: string; label: string };
  /** The primary next step, or null when there is nothing to do */
  action: { label: string; href: string } | null;
  /** True when the pass can be played now (lobby or screening) */
  watchable: boolean;
  /** A line under the badge: where money owed back for the pass is */
  note?: string;
}

/** Where money owed back for the pass is: on a cancelled pass, or a paid one (paid twice) */
function refundNote(ticket: TicketDetail): string | undefined {
  if (ticket.refund?.state === "PENDING") return "Refund on its way";
  if (ticket.refund?.state === "REFUNDED") return "Refunded";
  return undefined;
}

/**
 * Why a pass was cancelled, in one sentence, from the API's reason. Staff's own words, when they
 * gave any, are shown beside it (`cancellation.message`).
 */
export function cancellationText(ticket: TicketDetail): string {
  switch (ticket.cancellation?.reason) {
    case "SHOWTIME_CANCELLED":
      return "The screening was cancelled.";
    case "CANCELLED_BY_SUPPORT":
      return "Our support team cancelled this pass.";
    case "RELEASED_BY_MEMBER":
      return "You released this hold before paying. Nothing was charged.";
    case "HOLD_EXPIRED":
      return "This hold ran out before payment. Nothing was charged.";
    case "ACCOUNT_DELETED":
      return "This pass was cancelled when the account was deleted.";
    default:
      // Passes cancelled before reasons were recorded
      return "This pass was cancelled.";
  }
}

export function ticketView(ticket: TicketDetail, now: number): TicketView {
  const pass = `/dashboard/tickets/${ticket.id}`;
  const watch = `/watch/${ticket.id}`;
  const start = Date.parse(ticket.startTime);
  // The API serves each pass its own end of access; never work it out from the end time
  const cutoff = Date.parse(ticket.accessEndsAt);
  const showtimePage = `/movies/${ticket.movieSlug}/showtimes/${ticket.showtimeId}`;

  // A hold that ran out or was let go: the API cancels it with that reason (it never sets
  // EXPIRED today); either way the member can book again while the screening is to come
  const rebook = now < start ? { label: "Book again", href: showtimePage } : null;
  if (ticket.status === "CANCELLED" && ticket.cancellation?.reason === "HOLD_EXPIRED") {
    return {
      phase: "hold-expired",
      badge: { kind: "ticket", status: "EXPIRED", label: "Hold expired" },
      action: rebook,
      watchable: false,
    };
  }
  if (ticket.status === "CANCELLED" && ticket.cancellation?.reason === "RELEASED_BY_MEMBER") {
    return {
      phase: "released",
      badge: { kind: "ticket", status: "EXPIRED", label: "Released" },
      action: rebook,
      watchable: false,
    };
  }

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
      action: rebook,
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
      note: refundNote(ticket),
    };
  }
  if (now >= start) {
    return {
      phase: "live",
      badge: { kind: "showtime", status: "LIVE", label: "Live now" },
      action: { label: "Watch now", href: watch },
      watchable: true,
      note: refundNote(ticket),
    };
  }
  if (now >= Date.parse(ticket.lobbyOpensAt)) {
    return {
      phase: "lobby",
      badge: { kind: "ticket", status: "CONFIRMED", label: "Lobby open" },
      action: { label: "Enter lobby", href: watch },
      watchable: true,
      note: refundNote(ticket),
    };
  }
  return {
    phase: "upcoming",
    badge: { kind: "ticket", status: "CONFIRMED", label: "Confirmed" },
    action: { label: "View pass", href: pass },
    watchable: false,
    note: refundNote(ticket),
  };
}
