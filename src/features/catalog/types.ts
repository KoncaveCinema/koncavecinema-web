import type { PublicFilmStatus } from "@/api/movies/movies-schemas";
import type { TierPrices } from "@/api/showtimes/showtimes-schemas";
import type { AgeRating } from "@/types/domain";

/** A screening as the API lists it (GET /showtimes or GET /movies/:slug), with what each room costs. */
export interface CatalogShowtime {
  id: string;
  startTime: string;
  endTime: string;
  currency: string;
  /** What one Individual seat costs the buyer, fee included */
  priceFrom: number;
  /** What one booking of each room costs the buyer (the API's totalPayable) */
  tierPrices: TierPrices;
}

/**
 * A public film: published, or announced as coming soon. Only fields the API provides; anything
 * the design wants beyond these (cast, director, genres) is a request for the API first.
 */
export interface CatalogFilm {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  status: PublicFilmStatus;
  trailerUrl: string | null;
  posterLandscape: string;
  posterPortrait: string;
  /**
   * Where to centre crops of the landscape art (CSS object-position), so faces stay in frame on
   * tall cards. Not from the API: art direction, kept with the sample data for now.
   */
  posterFocus?: string;
  /** The lowest a buyer pays for a seat (fee included); null when no screening is open */
  priceFrom: { amount: number; currency: string } | null;
  /** Start of the next screening not yet over; it may lie beyond `showtimes` */
  nextShowtimeAt: string | null;
  /** Screenings not yet over, in all */
  showtimeCount: number;
  /**
   * Its screenings, soonest first. In lists: those in the schedule window (GET /showtimes, the
   * next 14 days). On the film page: every one not yet over (GET /movies/:slug).
   */
  showtimes: CatalogShowtime[];
}

/** GET /movies/:slug: the film page's film, with its certificate */
export interface FilmDetail extends CatalogFilm {
  /** NFVCB classification certificate, once the film has been bound to one */
  nfvcbCertNumber: string | null;
  nfvcbCertUrl: string | null;
}

/** A showtime together with its film, the unit most home sections render */
export interface Screening {
  film: CatalogFilm;
  showtime: CatalogShowtime;
}
