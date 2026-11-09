import { z } from "zod";

/*
 * The public showtime replies the web app reads, checked against koncavecinema-api's openapi.json
 * (dev, 310291c): only the fields the screens use. Every amount is the API's; the browser never
 * adds prices up itself.
 */

export const ticketTierSchema = z.enum(["INDIVIDUAL", "PUBLIC", "PRIVATE_5", "PRIVATE_10"]);

export const ageRatingSchema = z.enum(["G", "PG", "TWELVE_PLUS", "FIFTEEN_PLUS", "EIGHTEEN_PLUS"]);

/** What a buyer pays for one booking of each room, fee included (each room's totalPayable) */
export const tierPricesSchema = z.object({
  INDIVIDUAL: z.number(),
  PUBLIC: z.number(),
  PRIVATE_5: z.number(),
  PRIVATE_10: z.number(),
});
export type TierPrices = z.infer<typeof tierPricesSchema>;

/** The one customer-facing price formula (API `common/money/pricing.ts`) */
export const pricingBreakdownSchema = z.object({
  currency: z.string(),
  /** The producer's price for one admission */
  basePrice: z.number(),
  seatCount: z.number(),
  /** basePrice × seatCount */
  baseAmount: z.number(),
  /** 20% on private suites, 0 otherwise */
  infrastructureMarkup: z.number(),
  subtotal: z.number(),
  vatPercent: z.number(),
  vatAmount: z.number(),
  /** Payment gateway fee, passed through to the buyer */
  processingFee: z.number(),
  /** What the buyer pays */
  totalPayable: z.number(),
});
export type PricingBreakdown = z.infer<typeof pricingBreakdownSchema>;

/** GET /showtimes?from=&to=: the public schedule, soonest first */
export const scheduleShowtimeSchema = z.object({
  id: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  isLive: z.boolean(),
  currency: z.string(),
  /** The Individual room's totalPayable: what one ticket costs the buyer */
  priceFrom: z.number(),
  tierPrices: tierPricesSchema,
  movie: z.object({
    slug: z.string(),
    title: z.string(),
    ageRating: ageRatingSchema,
    durationMinutes: z.number(),
    posterPortrait: z.string(),
    posterLandscape: z.string(),
  }),
});
export type ScheduleShowtime = z.infer<typeof scheduleShowtimeSchema>;

export const tierCapacitySchema = z.object({
  tier: ticketTierSchema,
  tierName: z.string(),
  seatCount: z.number(),
  requiresKyc: z.boolean(),
  description: z.string(),
  pricing: pricingBreakdownSchema,
});
export type TierCapacity = z.infer<typeof tierCapacitySchema>;

/** GET /showtimes/:id/capacity: the four rooms with their price breakdowns */
export const showtimeCapacitySchema = z.object({
  showtimeId: z.string(),
  movieTitle: z.string(),
  movieSlug: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  confirmedTicketsCount: z.number(),
  activeHoldsCount: z.number(),
  tiers: z.array(tierCapacitySchema),
});
export type ShowtimeCapacity = z.infer<typeof showtimeCapacitySchema>;
