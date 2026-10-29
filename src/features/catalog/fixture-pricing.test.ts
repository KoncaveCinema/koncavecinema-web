import { describe, expect, it } from "vitest";

import { fixturePricing } from "./fixture-pricing";
import { groupNowShowing } from "./screening";
import type { CatalogFilm } from "./types";

describe("fixturePricing (copy of the API's price formula)", () => {
  it("matches the API's documented example for one admission", () => {
    // PricingBreakdownDto example: NGN 2,500 base, total payable 2,639.60
    const pricing = fixturePricing(2500, "INDIVIDUAL");
    expect(pricing.processingFee).toBe(139.6);
    expect(pricing.totalPayable).toBe(2639.6);
  });

  it("adds the 20% suite markup on base × seats", () => {
    const pricing = fixturePricing(5000, "PRIVATE_5");
    expect(pricing.seatCount).toBe(5);
    expect(pricing.baseAmount).toBe(25000);
    expect(pricing.infrastructureMarkup).toBe(5000);
    expect(pricing.subtotal).toBe(30000);
  });

  it("caps the processing fee at NGN 2,000", () => {
    // The largest real booking (NGN 10,000 × 10 + 20%) stays under the cap; a larger one hits it
    expect(fixturePricing(10000, "PRIVATE_10").processingFee).toBe(1928.94);
    expect(fixturePricing(20000, "PRIVATE_10").processingFee).toBe(2000);
  });

  it("adds up to the total", () => {
    const p = fixturePricing(4500, "PUBLIC");
    expect(p.subtotal + p.vatAmount + p.processingFee).toBeCloseTo(p.totalPayable, 2);
  });
});

describe("groupNowShowing", () => {
  const film = (id: string, start: string): CatalogFilm => ({
    id,
    slug: id,
    title: id,
    synopsis: "",
    durationMinutes: 100,
    ageRating: "PG",
    producerName: "",
    nfvcbCertNumber: null,
    nfvcbCertUrl: null,
    trailerUrl: null,
    posterLandscape: "",
    posterPortrait: "",
    showtimes: [
      {
        id: `${id}-1`,
        startTime: start,
        endTime: start,
        currency: "NGN",
        basePrice: 1,
        tierPrices: {},
      },
    ],
  });

  it("splits films a week after the earliest showtime, soonest first", () => {
    const { thisWeek, later } = groupNowShowing([
      film("c", "2026-11-20T19:00:00Z"),
      film("a", "2026-11-01T19:00:00Z"),
      film("b", "2026-11-05T19:00:00Z"),
    ]);
    expect(thisWeek.map((f) => f.id)).toEqual(["a", "b"]);
    expect(later.map((f) => f.id)).toEqual(["c"]);
  });
});
