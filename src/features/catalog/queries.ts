import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "@/env";
import { serverApi } from "@/lib/api/server";
import { dayKey, HOME_TIME_ZONE } from "@/lib/format";

import type { ApiScheduleShowtime, ApiShowtimeCapacity } from "./api-types";
import { FIXTURE_TIERS, fixturePricing } from "./fixture-pricing";
import { FAILURE_LIFE, getCatalog } from "./get-catalog";
import type { CatalogFilm, CatalogShowtime } from "./types";

/*
 * Server-side reads for the film, showtime and schedule pages. Each returns the API's own shape,
 * built from the sample catalog when NEXT_PUBLIC_DATA_SOURCE=fixtures, so the pages render the
 * same either way.
 */

const fixtures = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";

export async function getFilm(slug: string): Promise<CatalogFilm | null> {
  const { films } = await getCatalog();
  return films.find((film) => film.slug === slug) ?? null;
}

export interface ShowtimeWithFilm {
  film: CatalogFilm;
  showtime: CatalogShowtime;
}

export async function getShowtime(
  slug: string,
  showtimeId: string,
): Promise<ShowtimeWithFilm | null> {
  const film = await getFilm(slug);
  const showtime = film?.showtimes.find((item) => item.id === showtimeId);
  return film && showtime ? { film, showtime } : null;
}

/** GET /showtimes/:id/capacity: the four rooms with their price breakdowns. */
export async function getShowtimeCapacity({
  film,
  showtime,
}: ShowtimeWithFilm): Promise<ApiShowtimeCapacity | null> {
  if (fixtures) {
    return {
      showtimeId: showtime.id,
      movieTitle: film.title,
      movieSlug: film.slug,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      confirmedTicketsCount: 0,
      activeHoldsCount: 0,
      tiers: FIXTURE_TIERS.map((tier) => ({
        ...tier,
        seatCount: fixturePricing(showtime.basePrice, tier.tier).seatCount,
        pricing: fixturePricing(showtime.basePrice, tier.tier),
      })),
    };
  }
  return loadCapacity(showtime.id);
}

async function loadCapacity(showtimeId: string): Promise<ApiShowtimeCapacity | null> {
  "use cache";
  cacheTag("catalog");
  try {
    const capacity = await serverApi.get<ApiShowtimeCapacity>(`/showtimes/${showtimeId}/capacity`);
    cacheLife("minutes");
    return capacity;
  } catch {
    cacheLife(FAILURE_LIFE);
    return null;
  }
}

/** "2026-10-28": a calendar day in Lagos time. The API's date filters are Lagos days, so a viewer
 * abroad still asks for the same days the schedule is organised by. */
function lagosDay(time: number): string {
  return dayKey(time, HOME_TIME_ZONE);
}

const SCHEDULE_DAYS = 14;
const SCHEDULE_PAGE_SIZE = 100;
const SCHEDULE_MAX_PAGES = 5;

/**
 * GET /showtimes for today and the next 13 days (Lagos). Like the catalog, a failure is caught
 * inside the cache (so the build survives an unreachable API) and kept briefly. Null means
 * unavailable.
 */
async function loadApiSchedule(): Promise<ApiScheduleShowtime[] | null> {
  "use cache";
  cacheTag("catalog");
  try {
    const items = await fetchApiSchedule();
    cacheLife("minutes");
    return items;
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    console.error("Schedule unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Every page of the schedule, up to a sane limit */
async function fetchApiSchedule(): Promise<ApiScheduleShowtime[]> {
  const now = Date.now();
  const params = {
    from: lagosDay(now),
    to: lagosDay(now + (SCHEDULE_DAYS - 1) * 86_400_000),
    pageSize: SCHEDULE_PAGE_SIZE,
  };
  const items: ApiScheduleShowtime[] = [];
  for (let page = 1; page <= SCHEDULE_MAX_PAGES; page++) {
    const result = await serverApi.getPage<ApiScheduleShowtime>("/showtimes", {
      params: { ...params, page },
    });
    items.push(...result.items);
    if (!result.meta.hasNextPage) break;
  }
  return items;
}

/**
 * GET /showtimes: every upcoming showtime across the catalog, soonest first. From the API when it
 * is connected; built from the sample catalog in fixtures mode. An unreachable API gives an empty
 * schedule (the page shows its empty state) rather than an error.
 */
export async function getSchedule(): Promise<ApiScheduleShowtime[]> {
  if (!fixtures) return (await loadApiSchedule()) ?? [];
  const { films } = await getCatalog();
  return films
    .flatMap((film) =>
      film.showtimes.map((showtime): ApiScheduleShowtime => ({
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        isLive: false,
        currency: showtime.currency,
        priceFrom: showtime.tierPrices.INDIVIDUAL ?? showtime.basePrice,
        movie: {
          slug: film.slug,
          title: film.title,
          ageRating: film.ageRating,
          durationMinutes: film.durationMinutes,
          posterPortrait: film.posterPortrait,
          posterLandscape: film.posterLandscape,
        },
      })),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}
