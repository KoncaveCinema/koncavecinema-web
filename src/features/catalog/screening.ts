import type { TicketTier } from "@/types/domain";
import type { CatalogFilm, CatalogShowtime, Screening } from "./types";

/** Showtimes that have not finished, soonest first (the API lists only those). */
export function sortedShowtimes(film: CatalogFilm): CatalogShowtime[] {
  return [...film.showtimes].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

/** Every screening across the catalog, soonest first. */
export function allScreenings(films: CatalogFilm[]): Screening[] {
  return films
    .flatMap((film) => film.showtimes.map((showtime) => ({ film, showtime })))
    .sort((a, b) => Date.parse(a.showtime.startTime) - Date.parse(b.showtime.startTime));
}

/**
 * The lowest of the API's own figures across showtimes: a room's total when a tier is given,
 * otherwise the Individual seat (`priceFrom`). Never a computed price.
 */
export function lowestPrice(
  showtimes: CatalogShowtime[],
  tier?: TicketTier,
): { amount: number; currency: string } | null {
  let best: { amount: number; currency: string } | null = null;
  for (const showtime of showtimes) {
    const amount = tier ? showtime.tierPrices[tier] : showtime.priceFrom;
    if (!best || amount < best.amount) best = { amount, currency: showtime.currency };
  }
  return best;
}

/** Splits a title so its last word can take the outlined treatment: "Lagos After" + "Dark". */
export function splitTitle(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { lead: "", accent: title };
  return { lead: words.slice(0, -1).join(" "), accent: words.at(-1)! };
}

/** "A Harmattan Pictures production": the credit the API provides. */
export function creditLine(film: CatalogFilm): string {
  return `A ${film.producerName} production`;
}

const WEEK_MS = 7 * 24 * 60 * 60_000;

/**
 * The Now showing page's two groups: films playing within a week of the earliest showtime, and
 * films premiering after that. Measured from the earliest showtime rather than the clock, so the
 * page can stay static. Each group is soonest first.
 */
export function groupNowShowing(films: CatalogFilm[]): {
  thisWeek: CatalogFilm[];
  later: CatalogFilm[];
} {
  const withNext = films
    .flatMap((film) =>
      film.nextShowtimeAt ? [{ film, next: Date.parse(film.nextShowtimeAt) }] : [],
    )
    .sort((a, b) => a.next - b.next);
  const first = withNext[0];
  if (!first) return { thisWeek: [], later: [] };
  const horizon = first.next + WEEK_MS;
  return {
    thisWeek: withNext.filter((entry) => entry.next <= horizon).map((entry) => entry.film),
    later: withNext.filter((entry) => entry.next > horizon).map((entry) => entry.film),
  };
}

/** The shared-element name a film's art uses, so a card's still morphs into the film page */
export function filmArtTransition(slug: string): string {
  return `film-art-${slug}`;
}
