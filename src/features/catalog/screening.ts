import type { CatalogFilm, CatalogShowtime, Screening, TicketTier } from "./types";

/** The lobby opens 30 minutes before the start (API Phase 5 screening window). */
export const LOBBY_OPENS_BEFORE_MS = 30 * 60_000;

export type ScreeningPhase = "upcoming" | "lobby" | "live" | "ended";

/** Where a showtime is in its lifecycle at `now`. */
export function screeningPhase(
  showtime: Pick<CatalogShowtime, "startTime" | "endTime">,
  now: number,
): ScreeningPhase {
  const start = Date.parse(showtime.startTime);
  const end = Date.parse(showtime.endTime);
  if (now >= end) return "ended";
  if (now >= start) return "live";
  if (now >= start - LOBBY_OPENS_BEFORE_MS) return "lobby";
  return "upcoming";
}

export function lobbyOpensAt(showtime: Pick<CatalogShowtime, "startTime">): string {
  return new Date(Date.parse(showtime.startTime) - LOBBY_OPENS_BEFORE_MS).toISOString();
}

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
    const amounts = tier
      ? [showtime.tierPrices[tier]]
      : [showtime.basePrice, ...Object.values(showtime.tierPrices)];
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
