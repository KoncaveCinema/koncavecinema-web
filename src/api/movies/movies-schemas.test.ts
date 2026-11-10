import { describe, expect, it } from "vitest";

import { pageSchema } from "../page-schema";
import { featuredFilmSchema, movieDetailSchema, movieListItemSchema } from "./movies-schemas";

// Shapes from openapi.json on dev (310291c), envelope removed
const film = {
  id: "8f14e45f-ceea-467f-a8f4-3c1f5e2b9a10",
  title: "Ember and Ash",
  slug: "ember-and-ash",
  synopsis: "A family secret surfaces on the night of a wedding.",
  durationMinutes: 112,
  ageRating: "FIFTEEN_PLUS",
  producerName: "Koncave Originals",
  trailerStreamUrl: "https://stream.mux.com/abc.m3u8",
  posterLandscape: "https://res.cloudinary.com/koncave/landscape.jpg",
  posterPortrait: "https://res.cloudinary.com/koncave/portrait.jpg",
  status: "PUBLISHED",
};

const listItem = {
  ...film,
  createdAt: "2026-10-01T09:00:00.000Z",
  nextShowtimeAt: "2026-11-14T19:00:00.000Z",
  _count: { showtimes: 3 },
  priceFrom: { amount: 3762.5, currency: "NGN" },
};

const meta = {
  page: 1,
  pageSize: 50,
  total: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
};

const showtime = {
  id: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  startTime: "2026-11-14T19:00:00.000Z",
  endTime: "2026-11-14T21:22:00.000Z",
  basePrice: "3000",
  currency: "NGN",
  isLive: false,
  isCompleted: false,
  priceFrom: 3762.5,
  tierPrices: { INDIVIDUAL: 3762.5, PUBLIC: 3762.5, PRIVATE_5: 22575, PRIVATE_10: 45150 },
};

describe("movies schemas", () => {
  it("accept the film list, and an announced film without a price or next screening", () => {
    const announced = {
      ...listItem,
      status: "COMING_SOON",
      nextShowtimeAt: null,
      _count: { showtimes: 0 },
      priceFrom: null,
    };
    const page = pageSchema(movieListItemSchema).parse({ items: [listItem, announced], meta });
    expect(page.items.map((item) => item.status)).toEqual(["PUBLISHED", "COMING_SOON"]);
  });

  it("accept the featured films: placed, filling in from the schedule, and coming soon", () => {
    const placed = { ...listItem, featured: true, featuredUntil: "2026-12-07T23:00:00.000Z" };
    const filler = { ...listItem, slug: "red-soil", featured: false, featuredUntil: null };
    const announced = {
      ...listItem,
      slug: "harmattan-wedding",
      status: "COMING_SOON",
      nextShowtimeAt: null,
      _count: { showtimes: 0 },
      priceFrom: null,
      featured: true,
      featuredUntil: null,
    };
    const films = [placed, filler, announced].map((film) => featuredFilmSchema.parse(film));
    expect(films.map((film) => film.featured)).toEqual([true, false, true]);
    expect(featuredFilmSchema.safeParse({ ...listItem, featuredUntil: null }).success).toBe(false);
  });

  it("accept a film page, and a coming-soon film not yet certified", () => {
    const detail = {
      ...film,
      nfvcbCertNumber: "NFVCB/2026/FP/00912",
      nfvcbCertUrl: "https://compliance.koncavecinema.com/certs/ember.pdf",
      isPublished: true,
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-02T09:00:00.000Z",
      showtimes: [showtime],
    };
    expect(movieDetailSchema.parse(detail).showtimes[0]?.tierPrices.PRIVATE_10).toBe(45150);

    const uncertified = {
      ...detail,
      status: "COMING_SOON",
      nfvcbCertNumber: null,
      nfvcbCertUrl: null,
      showtimes: [],
    };
    expect(movieDetailSchema.parse(uncertified).nfvcbCertNumber).toBeNull();
  });

  it("refuse a draft or a film the screens couldn't render", () => {
    expect(movieListItemSchema.safeParse({ ...listItem, status: "DRAFT" }).success).toBe(false);
    expect(movieListItemSchema.safeParse({ ...listItem, ageRating: "R" }).success).toBe(false);
    const { tierPrices: _missing, ...priceless } = showtime;
    expect(
      movieDetailSchema.safeParse({
        ...film,
        nfvcbCertNumber: null,
        nfvcbCertUrl: null,
        showtimes: [priceless],
      }).success,
    ).toBe(false);
  });
});
