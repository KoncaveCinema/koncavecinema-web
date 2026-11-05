import { describe, expect, it } from "vitest";

import {
  fixtureAnnounced,
  fixtureMovieDetail,
  fixtureNowShowing,
  fixtureSchedule,
} from "./fixture-api";
import { fixturePricing } from "./fixture-pricing";

// The sample catalogue answers as the API does: the same lists, windows and prices
const now = Date.parse("2026-11-04T18:30:00.000Z");
const DAY = 24 * 60 * 60_000;

describe("fixture catalogue endpoints", () => {
  it("prices every screening with the API's figures, fee included", () => {
    for (const item of fixtureSchedule(now)) {
      expect(item.priceFrom).toBe(item.tierPrices.INDIVIDUAL);
    }
    const ember = fixtureMovieDetail(now, "ember-and-ash")!;
    expect(ember.showtimes[0]!.tierPrices.PRIVATE_5).toBe(
      fixturePricing(5000, "PRIVATE_5").totalPayable,
    );
  });

  it("lists published films with their next screening and lowest Individual total", () => {
    const films = fixtureNowShowing(now);
    expect(films.every((film) => film.status === "PUBLISHED")).toBe(true);
    const ember = films.find((film) => film.slug === "ember-and-ash")!;
    expect(ember.priceFrom).toEqual({
      amount: fixturePricing(5000, "INDIVIDUAL").totalPayable,
      currency: "NGN",
    });
    // Sorted by the next screening, which is the one playing now
    expect(films[0]!.slug).toBe("ember-and-ash");
  });

  it("keeps the schedule to 14 Lagos days while the film list goes further", () => {
    const schedule = fixtureSchedule(now);
    expect(schedule.every((item) => Date.parse(item.startTime) < now + 15 * DAY)).toBe(true);
    expect(schedule.some((item) => item.movie.slug === "starlight-over-kaduna")).toBe(false);
    const starlight = fixtureNowShowing(now).find((film) => film.slug === "starlight-over-kaduna");
    expect(starlight?.nextShowtimeAt).not.toBeNull();
  });

  it("leaves out screenings that are over", () => {
    const later = now + 3 * 60 * 60_000;
    const ember = fixtureMovieDetail(later, "ember-and-ash")!;
    expect(ember.showtimes.every((showtime) => Date.parse(showtime.endTime) > later)).toBe(true);
    expect(ember.showtimes.every((showtime) => !showtime.isCompleted)).toBe(true);
  });

  it("serves announced films with no screenings or price", () => {
    const announced = fixtureAnnounced(now);
    expect(announced.length).toBeGreaterThan(0);
    for (const film of announced) {
      expect(film).toMatchObject({
        status: "COMING_SOON",
        priceFrom: null,
        nextShowtimeAt: null,
        _count: { showtimes: 0 },
      });
      expect(fixtureMovieDetail(now, film.slug)?.showtimes).toEqual([]);
    }
    expect(fixtureNowShowing(now).some((film) => film.status === "COMING_SOON")).toBe(false);
  });
});
