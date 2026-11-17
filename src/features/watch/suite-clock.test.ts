import { describe, expect, it } from "vitest";

import { suiteMoment } from "./suite-clock";

const at = Date.parse("2026-11-17T20:00:00.000Z");
const clock = (isPaused: boolean, pauseRemainingSeconds = 1800) => ({
  isPaused,
  position: 600,
  serverTime: new Date(at).toISOString(),
  pauseRemainingSeconds,
});

describe("the suite clock", () => {
  it("runs on from the host's last moment", () => {
    expect(suiteMoment(clock(false), at + 90_000)).toEqual({
      paused: false,
      position: 690,
      pauseLeft: 1800,
    });
  });

  it("holds the film while paused, counting the allowance down", () => {
    expect(suiteMoment(clock(true), at + 60_000)).toEqual({
      paused: true,
      position: 600,
      pauseLeft: 1740,
    });
  });

  it("resumes on its own when a pause uses up the allowance, as the API does", () => {
    // 5 minutes of allowance left, paused for 7: running again for the last 2
    expect(suiteMoment(clock(true, 300), at + 420_000)).toEqual({
      paused: false,
      position: 720,
      pauseLeft: 0,
    });
  });
});
