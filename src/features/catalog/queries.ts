import "server-only";

import type { ApiScheduleShowtime, ApiShowtimeCapacity } from "./api-types";
import { toFilmDetail } from "./catalog-view";
import { readCapacity, readMovie, readSchedule } from "./sources";
import type { CatalogShowtime, FilmDetail } from "./types";

/*
 * Server-side reads for the film, showtime and schedule pages, each straight from its endpoint
 * (sources.ts), so the pages render the same with the API or the sample catalogue.
 */

/** GET /movies/:slug: a published or coming-soon film, or null (unknown, a draft, or unreachable) */
export async function getFilm(slug: string): Promise<FilmDetail | null> {
  const movie = await readMovie(slug);
  return movie ? toFilmDetail(movie) : null;
}

export interface ShowtimeWithFilm {
  film: FilmDetail;
  showtime: CatalogShowtime;
}

/** A screening not yet over, with its film; null once it has ended or when it doesn't exist */
export async function getShowtime(
  slug: string,
  showtimeId: string,
): Promise<ShowtimeWithFilm | null> {
  const film = await getFilm(slug);
  const showtime = film?.showtimes.find((item) => item.id === showtimeId);
  return film && showtime ? { film, showtime } : null;
}

/** GET /showtimes/:id/capacity: the four rooms with their price breakdowns. */
export async function getShowtimeCapacity({
  showtime,
}: ShowtimeWithFilm): Promise<ApiShowtimeCapacity | null> {
  return readCapacity(showtime.id);
}

/**
 * GET /showtimes: every screening in the next two weeks, soonest first. An unreachable API gives
 * an empty schedule (the page shows its empty state) rather than an error.
 */
export async function getSchedule(): Promise<ApiScheduleShowtime[]> {
  return (await readSchedule()) ?? [];
}
