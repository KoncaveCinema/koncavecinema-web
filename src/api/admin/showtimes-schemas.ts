import { z } from "zod";

import { pageSchema } from "../page-schema";
import { ticketTierSchema } from "../showtimes/showtimes-schemas";

/*
 * The admin showtime replies the console reads, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f).
 */

/** The API's rule: LIVE until the last pass's end of access, then PAST */
export const showtimeStateSchema = z.enum(["UPCOMING", "LIVE", "PAST", "CANCELLED"]);
export type ShowtimeState = z.infer<typeof showtimeStateSchema>;
export type ShowtimeFilter = "upcoming" | "live" | "past" | "cancelled";

const showtimeBase = {
  id: z.string(),
  movie: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    posterPortrait: z.string(),
  }),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  basePrice: z.number(),
  currency: z.string(),
  state: showtimeStateSchema,
  cancelledAt: z.iso.datetime().nullable(),
  cancellationReason: z.string().nullable(),
};

/** One row of GET /admin/showtimes */
export const adminShowtimeListItemSchema = z.object({
  ...showtimeBase,
  ticketsSold: z.number(),
  activeHolds: z.number(),
});
export type AdminShowtimeListItem = z.infer<typeof adminShowtimeListItemSchema>;
export const adminShowtimePageSchema = pageSchema(adminShowtimeListItemSchema);

/** GET /admin/showtimes/:id: sales by room, suites and the money */
export const adminShowtimeSchema = z.object({
  ...showtimeBase,
  tiers: z.array(z.object({ tier: ticketTierSchema, sold: z.number(), holds: z.number() })),
  suites: z.array(
    z.object({
      id: z.string(),
      tier: ticketTierSchema,
      inviteCode: z.string(),
      seats: z.number(),
      seatsTaken: z.number(),
      host: z.object({
        id: z.string(),
        email: z.string(),
        publicScreenAlias: z.string().nullable(),
      }),
    }),
  ),
  revenue: z.object({
    payments: z.number(),
    gross: z.number(),
    gatewayFees: z.number(),
    producerShare: z.number(),
    platformShare: z.number(),
  }),
});
export type AdminShowtime = z.infer<typeof adminShowtimeSchema>;

/** POST /admin/showtimes/:id/cancel */
export const showtimeCancellationSchema = z.object({
  passesCancelled: z.number(),
  refundsQueued: z.number(),
  refundTotal: z.number(),
  currency: z.string(),
});
export type ShowtimeCancellation = z.infer<typeof showtimeCancellationSchema>;

/** POST /admin/showtimes, and PATCH /admin/showtimes/:id without the film. The API sets the end. */
export interface ShowtimeInput {
  movieId: string;
  startTime: string;
  basePrice: number;
  currency?: string;
}
