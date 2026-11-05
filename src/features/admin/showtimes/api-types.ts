import type { TicketTier } from "@/types/domain";

/** koncavecinema-api admin showtime shapes, field for field (src/admin/admin-showtimes.service.ts). */

export type ShowtimeState = "UPCOMING" | "LIVE" | "PAST" | "CANCELLED";
export type ShowtimeFilter = "upcoming" | "live" | "past" | "cancelled";

/** One row of GET /admin/showtimes */
export interface AdminShowtimeListItem {
  id: string;
  movie: { id: string; title: string; slug: string; posterPortrait: string };
  startTime: string;
  endTime: string;
  basePrice: number;
  currency: string;
  state: ShowtimeState;
  cancelledAt: string | null;
  cancellationReason: string | null;
  ticketsSold: number;
  activeHolds: number;
}

/** GET /admin/showtimes/:id */
export interface AdminShowtime extends Omit<AdminShowtimeListItem, "ticketsSold" | "activeHolds"> {
  tiers: { tier: TicketTier; sold: number; holds: number }[];
  suites: {
    id: string;
    tier: TicketTier;
    inviteCode: string;
    seats: number;
    seatsTaken: number;
    host: { id: string; email: string; publicScreenAlias: string | null };
  }[];
  revenue: {
    payments: number;
    gross: number;
    gatewayFees: number;
    producerShare: number;
    platformShare: number;
  };
}

/** POST /admin/showtimes/:id/cancel */
export interface ShowtimeCancellation {
  id: string;
  cancelledAt: string;
  passesCancelled: number;
  refundsQueued: number;
  refundTotal: number;
  currency: string;
}

/** POST /admin/showtimes, and PATCH /admin/showtimes/:id without the film. The API sets the end. */
export interface ShowtimeInput {
  movieId: string;
  startTime: string;
  basePrice: number;
  currency?: string;
}
