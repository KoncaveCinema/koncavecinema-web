import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "@/env";
import { ApiError } from "@/api/errors";
import { serverApi } from "@/api/http-server";
import { dayKey, HOME_TIME_ZONE } from "@/lib/format";

import type {
  ApiMovieDetail,
  ApiMovieListItem,
  ApiScheduleShowtime,
  ApiShowtimeCapacity,
} from "./api-types";
import {
  fixtureAnnounced,
  fixtureCapacity,
  fixtureMovieDetail,
  fixtureNowShowing,
  fixtureSchedule,
} from "./fixture-api";

/*
 * The public catalogue endpoints, one cached read each, in the API's own shapes. With
 * NEXT_PUBLIC_DATA_SOURCE=fixtures the sample catalogue answers instead, by the same rules, so
 * everything above this file is the same in both modes.
 *
 * Public data only, shared between visitors and refreshed about every minute. A failure is
 * caught inside the cache (an error thrown from a cached function during `next build` fails the
 * export even when the caller catches it) and kept for 30 seconds only. Null means unavailable.
 */

const fixtures = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";

/**
 * Cache lifetime for a failed API load: retried after 30 seconds. The expiry stays at the
 * 5-minute minimum so the result can still be prerendered rather than becoming dynamic.
 */
const FAILURE_LIFE = { stale: 300, revalidate: 30, expire: 300 };

async function cached<T>(label: string, load: () => Promise<T>): Promise<T | null> {
  try {
    const result = await load();
    cacheLife("minutes");
    return result;
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    console.error(`${label} unavailable:`, error instanceof Error ? error.message : error);
    return null;
  }
}

const FILMS_PAGE_SIZE = 50;

/** GET /movies?upcoming=true&sort=soonest: published films with a screening still to come */
export async function readNowShowing(): Promise<ApiMovieListItem[] | null> {
  "use cache";
  cacheTag("catalog");
  return cached("Films", async () => {
    if (fixtures) return fixtureNowShowing(Date.now());
    const page = await serverApi.getPage<ApiMovieListItem>("/movies", {
      params: { upcoming: true, sort: "soonest", page: 1, pageSize: FILMS_PAGE_SIZE },
    });
    return page.items;
  });
}

/** GET /movies?comingSoon=true: films announced but not yet bookable */
export async function readAnnounced(): Promise<ApiMovieListItem[] | null> {
  "use cache";
  cacheTag("catalog");
  return cached("Coming soon", async () => {
    if (fixtures) return fixtureAnnounced(Date.now());
    const page = await serverApi.getPage<ApiMovieListItem>("/movies", {
      params: { comingSoon: true, page: 1, pageSize: FILMS_PAGE_SIZE },
    });
    return page.items;
  });
}

const SCHEDULE_DAYS = 14;
const SCHEDULE_PAGE_SIZE = 100;
const SCHEDULE_MAX_PAGES = 5;

/** "2026-10-28": a calendar day in Lagos time, the days the API's date filters use */
function lagosDay(time: number): string {
  return dayKey(time, HOME_TIME_ZONE);
}

/** GET /showtimes for today and the next 13 days (Lagos): every page, up to a sane limit */
export async function readSchedule(): Promise<ApiScheduleShowtime[] | null> {
  "use cache";
  cacheTag("catalog");
  return cached("Schedule", async () => {
    const now = Date.now();
    if (fixtures) return fixtureSchedule(now);
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
  });
}

/**
 * GET /movies/:slug. Undefined when the film doesn't exist (or is a draft): the API's 404, which
 * is an answer, not an outage, so it is cached normally.
 */
export async function readMovie(slug: string): Promise<ApiMovieDetail | undefined | null> {
  "use cache";
  cacheTag("catalog");
  return cached("Film", async () => {
    if (fixtures) return fixtureMovieDetail(Date.now(), slug) ?? undefined;
    try {
      return await serverApi.get<ApiMovieDetail>(`/movies/${encodeURIComponent(slug)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined;
      throw error;
    }
  });
}

/** GET /showtimes/:id/capacity: the four rooms with their full price breakdowns */
export async function readCapacity(showtimeId: string): Promise<ApiShowtimeCapacity | null> {
  "use cache";
  cacheTag("catalog");
  return cached("Rooms", async () => {
    if (fixtures) {
      const capacity = fixtureCapacity(Date.now(), showtimeId);
      if (!capacity) throw new Error(`No sample showtime ${showtimeId}`);
      return capacity;
    }
    return serverApi.get<ApiShowtimeCapacity>(`/showtimes/${showtimeId}/capacity`);
  });
}
