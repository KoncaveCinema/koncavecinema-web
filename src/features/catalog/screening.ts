import type { TicketTier } from "@/types/domain";
import type { CatalogFilm, CatalogShowtime, Screening } from "./types";

/** Showtimes that have not finished, soonest first. No clock needed: compares to `endTime` later. */
export function sortedShowtimes(film: CatalogFilm): CatalogShowtime[] {
  return [...film.showtimes].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

/** Every screening across the catalog, soonest first. */
export function allScreenings(films: CatalogFilm[]): Screening[] {
  return films
    .flatMap((film) => film.showtimes.map((showtime) => ({ film, showtime })))
    .sort((a, b) => Date.parse(a.showtime.startTime) - Date.parse(b.showtime.startTime));
}

/** Lowest ticket price for a tier across showtimes, or across all tiers when none is given. */
export function lowestPrice(
  showtimes: CatalogShowtime[],
  tier?: TicketTier,
): { amount: number; currency: string } | null {
  let best: { amount: number; currency: string } | null = null;
  for (const showtime of showtimes) {
    const tierAmounts = Object.values(showtime.tierPrices);
    // What a buyer pays (tier totals); the bare base price only when no tier prices are known
    const amounts = tier
      ? [showtime.tierPrices[tier]]
      : tierAmounts.length
        ? tierAmounts
        : [showtime.basePrice];
    for (const amount of amounts) {
      if (typeof amount === "number" && (!best || amount < best.amount)) {
        best = { amount, currency: showtime.currency };
      }
    }
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
    .map((film) => ({ film, next: sortedShowtimes(film)[0] }))
    .filter((entry): entry is { film: CatalogFilm; next: CatalogShowtime } => Boolean(entry.next))
    .sort((a, b) => Date.parse(a.next.startTime) - Date.parse(b.next.startTime));
  const first = withNext[0];
  if (!first) return { thisWeek: [], later: [] };
  const horizon = Date.parse(first.next.startTime) + WEEK_MS;
  return {
    thisWeek: withNext
      .filter((entry) => Date.parse(entry.next.startTime) <= horizon)
      .map((e) => e.film),
    later: withNext
      .filter((entry) => Date.parse(entry.next.startTime) > horizon)
      .map((e) => e.film),
  };
}

/** The shared-element name a film's art uses, so a card's still morphs into the film page */
export function filmArtTransition(slug: string): string {
  return `film-art-${slug}`;
}
