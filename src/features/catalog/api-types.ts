import type { AgeRating, FilmStatus, TicketTier } from "@/types/domain";
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

/** What a buyer pays for one booking of each room, fee included (the capacity endpoint's totalPayable) */
export type ApiTierPrices = Record<TicketTier, number>;

/** A public film is either announced (coming soon) or published; drafts are never public */
export type PublicFilmStatus = Exclude<FilmStatus, "DRAFT">;

/**
 * GET /movies: published films, paginated. Optional filters: `upcoming=true` (only films with a
 * showtime still to come), `from`/`to` (ISO, at most 31 days apart: films with a showtime in that
 * window) and `sort=newest|soonest`. Now showing calls `?upcoming=true&sort=soonest`.
 *
 * `?comingSoon=true` lists the announced films instead, most recently announced first, with no
 * price, no next showtime and a zero count. It can't be combined with the other filters.
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
  /** Screenings not yet over */
  _count: { showtimes: number };
  status: PublicFilmStatus;
  /**
   * The lowest a buyer pays for a seat (Individual Watch, fee included) at the film's open
   * screenings, in the currency of its next one; null when none is open
   */
  priceFrom: { amount: number; currency: string } | null;
}

export interface ApiMovieShowtime {
  id: string;
  startTime: string;
  endTime: string;
  /** Decimal, serialised as a string */
  basePrice: string | number;
  currency: string;
  /** Started and not ended, from the clock */
  isLive: boolean;
  /** Always false: ended screenings aren't listed. Never filter on it */
  isCompleted: boolean;
  /** The Individual room's total, fee included */
  priceFrom: number;
  tierPrices: ApiTierPrices;
}

/** GET /movies/:slug: a published or coming-soon film (drafts are 404) with every screening not
 * yet over, soonest first. A coming-soon film has none. */
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
  status: PublicFilmStatus;
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
  tierPrices: ApiTierPrices;
  movie: {
    slug: string;
    title: string;
    ageRating: AgeRating;
    durationMinutes: number;
    posterPortrait: string;
    posterLandscape: string;
  };
}
