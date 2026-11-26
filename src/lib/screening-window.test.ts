import { describe, expect, it } from "vitest";

import {
  lastPhaseChange,
  screeningOverAt,
  watchableUntil,
  watchesAtOwnPace,
} from "./screening-window";

const MINUTE = 60_000;
const endTime = "2026-11-06T20:00:00.000Z";
const end = Date.parse(endTime);

describe("screening window", () => {
  it("gives Individual Watch an hour after the end, and every other room 15 minutes", () => {
    expect(watchableUntil({ endTime, tier: "INDIVIDUAL" })).toBe(end + 60 * MINUTE);
    expect(watchableUntil({ endTime, tier: "PUBLIC" })).toBe(end + 15 * MINUTE);
    expect(watchableUntil({ endTime, tier: "PRIVATE_5" })).toBe(end + 15 * MINUTE);
    expect(watchableUntil({ endTime, tier: "PRIVATE_10" })).toBe(end + 15 * MINUTE);
  });

  it("keeps a screening open until its latest room's cutoff", () => {
    expect(screeningOverAt({ endTime })).toBe(watchableUntil({ endTime, tier: "INDIVIDUAL" }));
  });

  it("lets only Individual Watch play at its own pace", () => {
    expect(watchesAtOwnPace("INDIVIDUAL")).toBe(true);
    expect(watchesAtOwnPace("PUBLIC")).toBe(false);
    expect(watchesAtOwnPace("PRIVATE_5")).toBe(false);
  });

  it("finds the last moment a list of screenings changed phase, so pages re-render only then", () => {
    const start = end - 120 * MINUTE;
    const showtimes = [{ startTime: new Date(start).toISOString(), endTime }];
    // Before the lobby: nothing has happened yet
    expect(lastPhaseChange(showtimes, start - 40 * MINUTE)).toBe(0);
    // The same answer all through the lobby, then the start, then the end
    expect(lastPhaseChange(showtimes, start - 20 * MINUTE)).toBe(start - 30 * MINUTE);
    expect(lastPhaseChange(showtimes, start - 1)).toBe(start - 30 * MINUTE);
    expect(lastPhaseChange(showtimes, start + MINUTE)).toBe(start);
    expect(lastPhaseChange(showtimes, end + MINUTE)).toBe(end);
  });
});
