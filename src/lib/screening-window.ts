/*
 * The screening window, as the API defines it (its src/ticketing/screening-window.ts): the lobby
 * opens 30 minutes before the start, and a pass stays watchable until 15 minutes after the end.
 * Every page that shows a lobby, a countdown or "watch now" reads it from here.
 */

export const LOBBY_OPENS_BEFORE_MS = 30 * 60_000;
export const WATCHABLE_AFTER_END_MS = 15 * 60_000;

export type ScreeningPhase = "upcoming" | "lobby" | "live" | "ended";

/** Where a showtime is in its lifecycle at `now`. */
export function screeningPhase(
  showtime: { startTime: string; endTime: string },
  now: number,
): ScreeningPhase {
  const start = Date.parse(showtime.startTime);
  if (now >= Date.parse(showtime.endTime)) return "ended";
  if (now >= start) return "live";
  if (now >= start - LOBBY_OPENS_BEFORE_MS) return "lobby";
  return "upcoming";
}

export function lobbyOpensAt(showtime: { startTime: string }): string {
  return new Date(Date.parse(showtime.startTime) - LOBBY_OPENS_BEFORE_MS).toISOString();
}

/** The last moment a pass can still be played (the API's hard cutoff), in milliseconds */
export function watchableUntil(showtime: { endTime: string }): number {
  return Date.parse(showtime.endTime) + WATCHABLE_AFTER_END_MS;
}
