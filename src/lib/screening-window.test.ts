import { describe, expect, it } from "vitest";

import { screeningOverAt, watchableUntil, watchesAtOwnPace } from "./screening-window";

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
});
