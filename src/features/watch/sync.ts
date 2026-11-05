import { seededRandom } from "@/lib/random";

/*
 * Synchronised playout (the API's docs/architecture/streaming-and-drm.md §3): everyone in a
 * screening watches the same moment. Plain functions, so the rules are unit-tested.
 */

/** How often the player compares its position with the room's, in milliseconds */
export const SYNC_CHECK_MS = 2_000;
/** Slightly faster playback to close a small gap without a visible jump */
export const CATCH_UP_RATE = 1.06;

/**
 * Where a viewer is against the room:
 * - `ahead`: past the room (a seek forward), snapped back;
 * - `live`: within 1.5 s, normal speed;
 * - `catch-up`: 1.5 to 8 s behind, played at 1.06× until level;
 * - `behind`: further back (paused, or a slow connection): normal speed, with "Jump to live".
 */
export type SyncZone = "ahead" | "live" | "catch-up" | "behind";

export function syncZone(lagSeconds: number): SyncZone {
  if (lagSeconds < -1.5) return "ahead";
  if (lagSeconds <= 1.5) return "live";
  if (lagSeconds <= 8) return "catch-up";
  return "behind";
}

/** The room's position in the film, in seconds, at `now` on the server's clock */
export function targetPosition(startTime: string, now: number): number {
  return Math.max(0, (now - Date.parse(startTime)) / 1000);
}

/* The watermark's drift: seeded by the API, so the same session always produces the same
   positions and a leaked recording can be traced to it. */

export interface WatermarkSpot {
  /** Left and top, as percentages of the picture, kept clear of the edges */
  x: number;
  y: number;
  /** How long it stays before drifting on: 20 to 40 seconds */
  holdMs: number;
}

/** The overlay's positions in order, for a session's seed. */
export function watermarkDrift(seed: number): () => WatermarkSpot {
  const random = seededRandom(seed);
  return () => ({
    x: 6 + random() * 62,
    y: 8 + random() * 74,
    holdMs: 20_000 + random() * 20_000,
  });
}

export const WATERMARK_OPACITY = { SUBTLE: 0.12, STRONG: 0.28 } as const;
