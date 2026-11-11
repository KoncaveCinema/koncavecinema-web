import { describe, expect, it } from "vitest";

import { pageSchema } from "../page-schema";
import { scheduleShowtimeSchema, showtimeCapacitySchema } from "./showtimes-schemas";

// Shapes from openapi.json on dev (310291c), envelope removed
const scheduled = {
  id: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  startTime: "2026-11-14T19:00:00.000Z",
  endTime: "2026-11-14T21:22:00.000Z",
  isLive: false,
  currency: "NGN",
  priceFrom: 3762.5,
  tierPrices: { INDIVIDUAL: 3762.5, PUBLIC: 3762.5, PRIVATE_5: 22575, PRIVATE_10: 45150 },
  movie: {
    slug: "ember-and-ash",
    title: "Ember and Ash",
    ageRating: "FIFTEEN_PLUS",
    durationMinutes: 112,
    posterPortrait: "https://res.cloudinary.com/koncave/portrait.jpg",
    posterLandscape: "https://res.cloudinary.com/koncave/landscape.jpg",
  },
};

const pricing = {
  currency: "NGN",
  basePrice: 3000,
  infrastructureMarkup: 0,
  seatCount: 1,
  baseAmount: 3000,
  subtotal: 3000,
  vatPercent: 7.5,
  vatAmount: 225,
  processingFee: 537.5,
  totalPayable: 3762.5,
};

describe("showtimes schemas", () => {
  it("accept a page of the schedule", () => {
    const page = pageSchema(scheduleShowtimeSchema).parse({
      items: [scheduled],
      meta: {
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    });
    expect(page.items[0]?.movie.slug).toBe("ember-and-ash");
  });

  it("accept a showtime's rooms with their price breakdowns", () => {
    const capacity = showtimeCapacitySchema.parse({
      showtimeId: scheduled.id,
      movieTitle: "Ember and Ash",
      movieSlug: "ember-and-ash",
      startTime: scheduled.startTime,
      endTime: scheduled.endTime,
      confirmedTicketsCount: 12,
      activeHoldsCount: 2,
      tiers: [
        {
          tier: "INDIVIDUAL",
          tierName: "Individual Watch",
          seatCount: 1,
          requiresKyc: false,
          description: "Watch alone, at your own pace.",
          pricing,
        },
      ],
    });
    expect(capacity.tiers[0]?.pricing.totalPayable).toBe(3762.5);
  });

  it("refuse an unknown room or a breakdown missing what the buyer pays", () => {
    const tier = {
      tier: "VIP",
      tierName: "VIP",
      seatCount: 1,
      requiresKyc: false,
      description: "",
      pricing,
    };
    const base = {
      showtimeId: "s1",
      movieTitle: "x",
      movieSlug: "x",
      startTime: scheduled.startTime,
      endTime: scheduled.endTime,
      confirmedTicketsCount: 0,
      activeHoldsCount: 0,
    };
    expect(showtimeCapacitySchema.safeParse({ ...base, tiers: [tier] }).success).toBe(false);
    const { totalPayable: _missing, ...unpriced } = pricing;
    expect(
      showtimeCapacitySchema.safeParse({
        ...base,
        tiers: [{ ...tier, tier: "PUBLIC", pricing: unpriced }],
      }).success,
    ).toBe(false);
  });
});
