import type { AgeRating, TicketTier } from "@/types/domain";

/** A showtime as the API returns it (GET /movies/:slug), with tier prices from its capacity endpoint. */
export interface CatalogShowtime {
  id: string;
  startTime: string;
  endTime: string;
  currency: string;
  basePrice: number;
  /** What one booking of each tier costs the buyer (the API's totalPayable) */
  tierPrices: Partial<Record<TicketTier, number>>;
}

/**
 * A published film. Only fields the API provides; anything the design wants beyond these (cast,
 * director, genres, teasers) is a request for the API first (implementation_plan.md section 8).
 */
export interface CatalogFilm {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  /** NFVCB classification certificate, once the film has been bound to one */
  nfvcbCertNumber: string | null;
  nfvcbCertUrl: string | null;
  trailerUrl: string | null;
  posterLandscape: string;
  posterPortrait: string;
  /**
   * Where to centre crops of the landscape art (CSS object-position), so faces stay in frame on
   * tall cards. Not from the API: art direction, kept with the sample data for now.
   */
  posterFocus?: string;
  showtimes: CatalogShowtime[];
}

export interface Catalog {
  films: CatalogFilm[];
  source: "api" | "fixtures";
  /** True when the API could not be reached; sections render their empty states */
  unavailable: boolean;
}

/** A showtime together with its film, the unit most home sections render */
export interface Screening {
  film: CatalogFilm;
  showtime: CatalogShowtime;
}
