import type { MovieDetail, MovieListItem, MovieShowtime } from "@/api/movies/movies-schemas";
import type { ScheduleShowtime } from "@/api/showtimes/showtimes-schemas";

import type { CatalogFilm, CatalogShowtime, FilmDetail } from "./types";

/*
 * API shapes to the shapes the pages render. Nothing is worked out here: every price, time and
 * status is copied from the API's answer.
 */

export function toShowtime(showtime: MovieShowtime | ScheduleShowtime): CatalogShowtime {
  return {
    id: showtime.id,
    startTime: showtime.startTime,
    endTime: showtime.endTime,
    currency: showtime.currency,
    priceFrom: showtime.priceFrom,
    tierPrices: showtime.tierPrices,
  };
}

type FilmFields = Omit<CatalogFilm, "priceFrom" | "nextShowtimeAt" | "showtimeCount" | "showtimes">;

function filmFields(movie: MovieListItem | MovieDetail): FilmFields {
  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    synopsis: movie.synopsis,
    durationMinutes: movie.durationMinutes,
    ageRating: movie.ageRating,
    producerName: movie.producerName,
    status: movie.status,
    trailerUrl: movie.trailerStreamUrl || null,
    posterLandscape: movie.posterLandscape,
    posterPortrait: movie.posterPortrait || movie.posterLandscape,
  };
}

/** A film from GET /movies, with its screenings from the schedule (GET /showtimes) */
export function toCatalogFilm(movie: MovieListItem, schedule: ScheduleShowtime[]): CatalogFilm {
  return {
    ...filmFields(movie),
    priceFrom: movie.priceFrom,
    nextShowtimeAt: movie.nextShowtimeAt,
    showtimeCount: movie._count.showtimes,
    showtimes: schedule.filter((item) => item.movie.slug === movie.slug).map(toShowtime),
  };
}

/** GET /movies/:slug. Its from-price is its cheapest screening's, as GET /movies gives it. */
export function toFilmDetail(movie: MovieDetail): FilmDetail {
  const showtimes = movie.showtimes.map(toShowtime);
  const cheapest = showtimes.reduce<CatalogShowtime | null>(
    (best, showtime) => (!best || showtime.priceFrom < best.priceFrom ? showtime : best),
    null,
  );
  return {
    ...filmFields(movie),
    nfvcbCertNumber: movie.nfvcbCertNumber,
    nfvcbCertUrl: movie.nfvcbCertUrl,
    priceFrom: cheapest && { amount: cheapest.priceFrom, currency: cheapest.currency },
    nextShowtimeAt: showtimes[0]?.startTime ?? null,
    showtimeCount: showtimes.length,
    showtimes,
  };
}
