import type { AgeRating, TicketTier } from "@/types/domain";
/**
 * koncavecinema-api response shapes for the catalog, field for field (movies, showtimes,
 * capacity, schedule). Replace with the generated types from `npm run api:types` once they exist.
 */

/**
 * The one customer-facing price formula (API `common/money/pricing.ts`). Every amount the
 * interface shows comes from one of these; the browser never adds prices up itself.
 */
export interface ApiPricingBreakdown {
  currency: string;
  /** The producer's price for one admission */
  basePrice: number;
  seatCount: number;
  /** basePrice × seatCount */
  baseAmount: number;
  /** 20% on private suites, 0 otherwise */
  infrastructureMarkup: number;
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  /** Payment gateway fee, passed through to the buyer */
  processingFee: number;
  /** What the buyer pays */
  totalPayable: number;
}

/**
 * GET /movies: published films, paginated. Optional filters: `upcoming=true` (only films with a
 * showtime still to come), `from`/`to` (ISO, at most 31 days apart: films with a showtime in that
 * window) and `sort=newest|soonest`. Now showing calls `?upcoming=true&sort=soonest`.
 */
export interface ApiMovieListItem {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  trailerStreamUrl: string;
  posterLandscape: string;
  posterPortrait: string;
  createdAt: string;
  /** Start of the film's next showtime (ISO), or null when nothing is scheduled */
  nextShowtimeAt: string | null;
  _count: { showtimes: number };
}

export interface ApiMovieShowtime {
  id: string;
  startTime: string;
  endTime: string;
  /** Decimal, serialised as a string */
  basePrice: string | number;
  currency: string;
  isLive: boolean;
  isCompleted: boolean;
}

/** GET /movies/:slug */
export interface ApiMovieDetail {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  trailerStreamUrl: string;
  posterLandscape: string;
  posterPortrait: string;
  nfvcbCertNumber: string | null;
  nfvcbCertUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  showtimes: ApiMovieShowtime[];
}

export interface ApiTierCapacity {
  tier: TicketTier;
  tierName: string;
  seatCount: number;
  requiresKyc: boolean;
  description: string;
  pricing: ApiPricingBreakdown;
}

/** GET /showtimes/:id/capacity */
export interface ApiShowtimeCapacity {
  showtimeId: string;
  movieTitle: string;
  movieSlug: string;
  startTime: string;
  endTime: string;
  confirmedTicketsCount: number;
  activeHoldsCount: number;
  tiers: ApiTierCapacity[];
}

/** GET /showtimes?from=&to=&movieSlug=: the public schedule, sorted by start time */
export interface ApiScheduleShowtime {
  id: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
  currency: string;
  /** The Individual tier's totalPayable: what one ticket costs the buyer */
  priceFrom: number;
  movie: {
    slug: string;
    title: string;
    ageRating: AgeRating;
    durationMinutes: number;
    posterPortrait: string;
    posterLandscape: string;
  };
}
