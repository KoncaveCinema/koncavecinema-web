import type { SuiteClock } from "@/api/rooms/rooms-schemas";

/*
 * A private suite's film follows the host, through a clock the API keeps (dev 5f0ce91). Plain
 * functions, so the rules are unit-tested; the player and the panels read them.
 */

export interface SuiteMoment {
  paused: boolean;
  /** Where the film should be, in seconds */
  position: number;
  /** Pause time left of the suite's 30 minutes, in seconds */
  pauseLeft: number;
}

/**
 * The suite's film at `serverNow` (the server's clock, in milliseconds). A pause that runs out
 * of allowance resumes at that moment on the API's side without any event, so it's worked out
 * here the same way: from then on the film runs again.
 */
export function suiteMoment(clock: SuiteClock, serverNow: number): SuiteMoment {
  const elapsed = Math.max(0, (serverNow - Date.parse(clock.serverTime)) / 1000);
  if (!clock.isPaused) {
    return {
      paused: false,
      position: clock.position + elapsed,
      pauseLeft: clock.pauseRemainingSeconds,
    };
  }
  if (elapsed < clock.pauseRemainingSeconds) {
    return {
      paused: true,
      position: clock.position,
      pauseLeft: clock.pauseRemainingSeconds - elapsed,
    };
  }
  return {
    paused: false,
    position: clock.position + (elapsed - clock.pauseRemainingSeconds),
    pauseLeft: 0,
  };
}

/** How far the host moves the film per press while paused */
export const SEEK_STEP_SECONDS = 10;
