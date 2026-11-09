import "server-only";

import { readComingSoon, readMovie, readNowShowing } from "@/api/movies/movies-server";
import type { ScheduleShowtime, ShowtimeCapacity } from "@/api/showtimes/showtimes-schemas";
import { readCapacity, readSchedule } from "@/api/showtimes/showtimes-server";

import { toCatalogFilm, toFilmDetail } from "./catalog-view";
import type { CatalogFilm, CatalogShowtime, FilmDetail } from "./types";

/*
 * The reads the pages and home sections call, each asking only for what it shows. The API reads
 * underneath are cached and shared, so two sections asking for the same thing make one request.
 * An unreachable API never breaks a page or the build: sections show their empty states.
 */

export interface NowShowing {
  /** Published films with a screening still to come, soonest first */
  films: CatalogFilm[];
  /** True when the API could not be read; sections render their empty states */
  unavailable: boolean;
}

/** GET /movies?upcoming=true, each film with its screenings in the next 14 days (GET /showtimes) */
export async function getNowShowing(): Promise<NowShowing> {
  const [films, schedule] = await Promise.all([readNowShowing(), readSchedule()]);
  return {
    films: (films ?? []).map((movie) => toCatalogFilm(movie, schedule ?? [])),
    unavailable: films === null,
  };
}

export interface AllFilms extends NowShowing {
  /** Films announced but not yet bookable, newest first */
  announced: CatalogFilm[];
}

/** Now showing and coming soon together (GET /movies twice: the API serves them separately) */
export async function getAllFilms(): Promise<AllFilms> {
  const [nowShowing, announced] = await Promise.all([getNowShowing(), readComingSoon()]);
  return {
    ...nowShowing,
    announced: (announced ?? []).map((movie) => toCatalogFilm(movie, [])),
  };
}

/** Why a film or showtime page has nothing to show: it doesn't exist, or the API is down */
export type Missing = "missing" | "unavailable";

/**
 * GET /movies/:slug: a published or coming-soon film. "missing" when it doesn't exist (unknown or
 * a draft), "unavailable" when the API couldn't be read, so an outage never answers "not found".
 */
export async function getFilm(slug: string): Promise<FilmDetail | Missing> {
  const movie = await readMovie(slug);
  if (movie === null) return "unavailable";
  if (movie === "missing") return "missing";
  return toFilmDetail(movie);
}

export interface ShowtimeWithFilm {
  film: FilmDetail;
  showtime: CatalogShowtime;
}

/** A screening not yet over, with its film; "missing" once it has ended or when it doesn't exist */
export async function getShowtime(
  slug: string,
  showtimeId: string,
): Promise<ShowtimeWithFilm | Missing> {
  const film = await getFilm(slug);
  if (typeof film === "string") return film;
  const showtime = film.showtimes.find((item) => item.id === showtimeId);
  return showtime ? { film, showtime } : "missing";
}

/** GET /showtimes/:id/capacity: the four rooms with their price breakdowns. */
export async function getShowtimeCapacity({
  showtime,
}: ShowtimeWithFilm): Promise<ShowtimeCapacity | null> {
  return readCapacity(showtime.id);
}

/**
 * GET /showtimes: every screening in the next two weeks, soonest first. An unreachable API gives
 * an empty schedule (the page shows its empty state) rather than an error.
 */
export async function getSchedule(): Promise<ScheduleShowtime[]> {
  return (await readSchedule()) ?? [];
}
