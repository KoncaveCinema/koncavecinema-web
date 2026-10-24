/**
 * The subset of koncavecinema-api response shapes the catalog uses (movies, showtimes,
 * capacity). Replace with the generated types from `npm run api:types` once they exist.
 */
import type { AgeRating } from "@/lib/format";

import type { TicketTier } from "./types";

export interface ApiMovieListItem {
  id: string;
  slug: string;
  title: string;
}

export interface ApiMovieShowtime {
  id: string;
  startTime: string;
  endTime: string;
  basePrice: string | number;
  currency: string;
  isLive: boolean;
  isCompleted: boolean;
}

export interface ApiMovieDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  trailerStreamUrl: string | null;
  posterLandscape: string;
  posterPortrait: string;
  showtimes: ApiMovieShowtime[];
}

export interface ApiPricingBreakdown {
  baseAmount: number;
  infrastructureMarkup: number;
  vatAmount: number;
  processingFee: number;
  customerTotal: number;
  currency: string;
}

export interface ApiShowtimeCapacity {
  showtimeId: string;
  tiers: { tier: TicketTier; seatCount: number; pricing: ApiPricingBreakdown }[];
}
