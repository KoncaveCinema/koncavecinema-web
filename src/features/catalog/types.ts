import type { AgeRating } from "@/lib/format";

export type TicketTier = "INDIVIDUAL" | "PUBLIC" | "PRIVATE_5" | "PRIVATE_10";

/** A showtime as the API returns it (GET /movies/:slug), with tier prices from its capacity endpoint. */
export interface CatalogShowtime {
  id: string;
  startTime: string;
  endTime: string;
  currency: string;
  basePrice: number;
  /** Ticket price per tier before the payment processing fee */
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
  trailerUrl: string | null;
  posterLandscape: string;
  posterPortrait: string;
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
