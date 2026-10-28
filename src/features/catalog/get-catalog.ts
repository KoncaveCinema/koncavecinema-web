import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "@/env";
import { serverApi } from "@/lib/api/server";

import type { ApiMovieDetail, ApiMovieListItem, ApiShowtimeCapacity } from "./api-types";
import { buildFixtureCatalog } from "./fixtures";
import type { Catalog, CatalogFilm, CatalogShowtime, TicketTier } from "./types";

// Capacity is fetched per showtime; cap the fan-out so a large catalog never floods the API
const MAX_CAPACITY_LOOKUPS = 24;

/**
 * Published films with their open showtimes and tier prices. Cached and shared
 * between visitors: public data only, refreshed about every minute in the background.
 */
async function loadApiCatalog(): Promise<CatalogFilm[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const list = await serverApi.getPage<ApiMovieListItem>("/movies", {
    // Now showing: films with a showtime still to come, soonest first
    params: { upcoming: true, sort: "soonest", page: 1, pageSize: 50 },
  });
  const details = await Promise.all(
    list.items.map((movie) => serverApi.get<ApiMovieDetail>(`/movies/${movie.slug}`)),
  );

  const openShowtimes = details.flatMap((movie) =>
    movie.showtimes.filter((showtime) => !showtime.isCompleted),
  );
  const capacities = new Map<string, ApiShowtimeCapacity>();
  await Promise.all(
    openShowtimes.slice(0, MAX_CAPACITY_LOOKUPS).map(async (showtime) => {
      try {
        const capacity = await serverApi.get<ApiShowtimeCapacity>(
          `/showtimes/${showtime.id}/capacity`,
        );
        capacities.set(showtime.id, capacity);
      } catch {
        // Prices then fall back to the base price; the page still renders
      }
    }),
  );

  return details.map((movie) => ({
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    synopsis: movie.synopsis,
    durationMinutes: movie.durationMinutes,
    ageRating: movie.ageRating,
    producerName: movie.producerName,
    nfvcbCertNumber: movie.nfvcbCertNumber,
    nfvcbCertUrl: movie.nfvcbCertUrl,
    trailerUrl: movie.trailerStreamUrl || null,
    posterLandscape: movie.posterLandscape,
    posterPortrait: movie.posterPortrait || movie.posterLandscape,
    showtimes: movie.showtimes
      .filter((showtime) => !showtime.isCompleted)
      .map((showtime): CatalogShowtime => {
        const capacity = capacities.get(showtime.id);
        const tierPrices: Partial<Record<TicketTier, number>> = {};
        for (const tier of capacity?.tiers ?? []) {
          // What the buyer pays, fee included: the same figure the schedule calls priceFrom
          tierPrices[tier.tier] = tier.pricing.totalPayable;
        }
        return {
          id: showtime.id,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          currency: showtime.currency,
          basePrice: Number(showtime.basePrice),
          tierPrices,
        };
      }),
  }));
}

async function loadFixtureCatalog(): Promise<CatalogFilm[]> {
  "use cache";
  cacheLife("minutes");
  return buildFixtureCatalog(Date.now());
}

/**
 * The catalog for public pages. An unreachable API never breaks a page: sections show their
 * empty states, and the failure is not cached, so the next request tries again.
 */
export async function getCatalog(): Promise<Catalog> {
  if (env.NEXT_PUBLIC_DATA_SOURCE === "fixtures") {
    return { films: await loadFixtureCatalog(), source: "fixtures", unavailable: false };
  }
  try {
    return { films: await loadApiCatalog(), source: "api", unavailable: false };
  } catch (error) {
    console.error("Catalog unavailable:", error instanceof Error ? error.message : error);
    return { films: [], source: "api", unavailable: true };
  }
}
