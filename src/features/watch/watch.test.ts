import { describe, expect, it } from "vitest";

import { filmOver, syncZone, targetPosition, watermarkDrift } from "./sync";

describe("synchronised playout", () => {
  it("sorts the gap to the room into its zones", () => {
    expect(syncZone(-3)).toBe("ahead");
    expect(syncZone(-1)).toBe("live");
    expect(syncZone(1.5)).toBe("live");
    expect(syncZone(4)).toBe("catch-up");
    expect(syncZone(8)).toBe("catch-up");
    expect(syncZone(9)).toBe("behind");
    expect(syncZone(600)).toBe("behind");
  });

  it("places the room at the time since the start, never before zero", () => {
    const start = "2026-11-06T18:00:00.000Z";
    expect(targetPosition(start, Date.parse(start) + 90_500)).toBe(90.5);
    expect(targetPosition(start, Date.parse(start) - 60_000)).toBe(0);
  });
});

describe("filmOver", () => {
  it("ends the screening once the room passes the end of the video", () => {
    expect(filmOver(59, 120)).toBe(false);
    expect(filmOver(119.6, 120)).toBe(true);
    expect(filmOver(4000, 120)).toBe(true);
    // Before the video's length is known, nothing has ended
    expect(filmOver(4000, Number.NaN)).toBe(false);
    expect(filmOver(4000, 0)).toBe(false);
  });
});

describe("watermark drift", () => {
  it("repeats exactly for the same seed, and stays on the picture", () => {
    const first = watermarkDrift(482193);
    const second = watermarkDrift(482193);
    for (let index = 0; index < 20; index++) {
      const spot = first();
      expect(second()).toEqual(spot);
      expect(spot.x).toBeGreaterThanOrEqual(6);
      expect(spot.x).toBeLessThanOrEqual(68);
      expect(spot.holdMs).toBeGreaterThanOrEqual(20_000);
      expect(spot.holdMs).toBeLessThanOrEqual(40_000);
    }
  });

  it("differs between sessions", () => {
    expect(watermarkDrift(1)()).not.toEqual(watermarkDrift(2)());
  });
});
