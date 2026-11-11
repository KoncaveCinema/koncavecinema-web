import { z } from "zod";

import { ageRatingSchema, tierPricesSchema } from "../showtimes/showtimes-schemas";

/*
 * The public film replies the web app reads, checked against koncavecinema-api's openapi.json
 * (dev, 310291c): only the fields the screens use.
 */

/** A public film is announced (coming soon) or published; drafts are never public */
export const publicFilmStatusSchema = z.enum(["COMING_SOON", "PUBLISHED"]);
export type PublicFilmStatus = z.infer<typeof publicFilmStatusSchema>;

const filmFields = {
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  synopsis: z.string(),
  durationMinutes: z.number(),
  ageRating: ageRatingSchema,
  producerName: z.string(),
  /** Empty until a trailer is attached */
  trailerStreamUrl: z.string(),
  posterLandscape: z.string(),
  posterPortrait: z.string(),
  status: publicFilmStatusSchema,
};

/**
 * GET /movies: `?upcoming=true&sort=soonest` lists the films with a screening still to come;
 * `?comingSoon=true` the announced ones, with no price, no next screening and a zero count.
 */
export const movieListItemSchema = z.object({
  ...filmFields,
  /** Start of the film's next screening, or null when nothing is scheduled */
  nextShowtimeAt: z.iso.datetime().nullable(),
  /** Screenings not yet over */
  _count: z.object({ showtimes: z.number() }),
  /** The lowest a buyer pays for a seat (Individual, fee included); null when none is open */
  priceFrom: z.object({ amount: z.number(), currency: z.string() }).nullable(),
});
export type MovieListItem = z.infer<typeof movieListItemSchema>;

/**
 * GET /movies/featured (feat/featured-films, 9b49e73): the films that lead the home page, in their
 * final order. Admin-placed films first, then films showing soonest to fill the list; coming-soon
 * films can appear, with no price and no next screening.
 */
export const featuredFilmSchema = movieListItemSchema.extend({
  /** true: placed by an admin; false: added from the schedule to fill the list */
  featured: z.boolean(),
  /** When a dated placement ends; null for the everyday lineup and schedule films */
  featuredUntil: z.iso.datetime().nullable(),
});
export type FeaturedFilm = z.infer<typeof featuredFilmSchema>;

/** A screening on the film page: every one not yet over, soonest first */
export const movieShowtimeSchema = z.object({
  id: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  currency: z.string(),
  /** The Individual room's total, fee included */
  priceFrom: z.number(),
  tierPrices: tierPricesSchema,
});
export type MovieShowtime = z.infer<typeof movieShowtimeSchema>;

/** GET /movies/:slug: a published or coming-soon film (drafts are 404) */
export const movieDetailSchema = z.object({
  ...filmFields,
  /** NFVCB certificate: null on a coming-soon film that isn't certified yet */
  nfvcbCertNumber: z.string().nullable(),
  nfvcbCertUrl: z.string().nullable(),
  showtimes: z.array(movieShowtimeSchema),
});
export type MovieDetail = z.infer<typeof movieDetailSchema>;
