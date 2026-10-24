import { sortedShowtimes } from "@/features/catalog/screening";
import type { CatalogFilm, Screening } from "@/features/catalog/types";

/**
 * Splitting the schedule into "tonight" and "coming soon" without reading the clock on the
 * server (that would make the page dynamic). The catalog only contains screenings that have not
 * finished, so the earliest one is effectively "now"; anything within 36 hours of it is tonight.
 */
const TONIGHT_SPAN_MS = 36 * 60 * 60_000;

function horizon(screenings: Screening[]): number | null {
  const first = screenings[0];
  return first ? Date.parse(first.showtime.startTime) + TONIGHT_SPAN_MS : null;
}

/** Tonight's screenings, one per film (its next one), soonest first. */
export function tonightWindow(screenings: Screening[]): Screening[] {
  const end = horizon(screenings);
  if (end === null) return [];
  const seen = new Set<string>();
  return screenings.filter((screening) => {
    if (Date.parse(screening.showtime.startTime) > end || seen.has(screening.film.id)) return false;
    seen.add(screening.film.id);
    return true;
  });
}

/** Films whose first screening is after tonight's window: the premieres to look forward to. */
export function comingSoonFilms(films: CatalogFilm[], screenings: Screening[]): CatalogFilm[] {
  const end = horizon(screenings);
  return films
    .filter((film) => {
      const first = sortedShowtimes(film)[0];
      return first && (end === null || Date.parse(first.startTime) > end);
    })
    .sort(
      (a, b) =>
        Date.parse(sortedShowtimes(a)[0]!.startTime) - Date.parse(sortedShowtimes(b)[0]!.startTime),
    );
}
