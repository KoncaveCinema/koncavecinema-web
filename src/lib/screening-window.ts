import type { TicketTier } from "@/types/domain";

/*
 * The screening window, as the API defines it (its src/ticketing/screening-window.ts): the lobby
 * opens 30 minutes before the start, and a pass stays watchable until 15 minutes after the end,
 * or an hour for Individual Watch, where the member pauses and rewinds at their own pace.
 * Every page that shows a lobby, a countdown or "watch now" reads it from here.
 */

export const LOBBY_OPENS_BEFORE_MS = 30 * 60_000;
export const WATCHABLE_AFTER_END_MS = 15 * 60_000;
export const INDIVIDUAL_WATCHABLE_AFTER_END_MS = 60 * 60_000;

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

/** Individual Watch is the member's own film; every other room keeps the room's moment */
export function watchesAtOwnPace(tier: TicketTier): boolean {
  return tier === "INDIVIDUAL";
}

/** The last moment a pass can still be played (the API's hard cutoff), in milliseconds */
export function watchableUntil(pass: { endTime: string; tier: TicketTier }): number {
  const after = watchesAtOwnPace(pass.tier)
    ? INDIVIDUAL_WATCHABLE_AFTER_END_MS
    : WATCHABLE_AFTER_END_MS;
  return Date.parse(pass.endTime) + after;
}

/** The last moment any pass for a showtime can be played: the latest room's cutoff */
export function screeningOverAt(showtime: { endTime: string }): number {
  return Date.parse(showtime.endTime) + INDIVIDUAL_WATCHABLE_AFTER_END_MS;
}
