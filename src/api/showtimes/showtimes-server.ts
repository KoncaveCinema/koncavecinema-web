import "server-only";

import { cacheTag } from "next/cache";

import { dayKey, HOME_TIME_ZONE } from "@/lib/format";

import { cachedRead } from "../cached-read";
import { httpServer } from "../http-server";
import { pageSchema } from "../page-schema";
import {
  scheduleShowtimeSchema,
  showtimeCapacitySchema,
  type ScheduleShowtime,
  type ShowtimeCapacity,
} from "./showtimes-schemas";

/*
 * The public showtime reads, cached for every visitor (see cached-read.ts). Each reply is parsed
 * before anything reads it. Null means the API couldn't be read.
 */

const SCHEDULE_DAYS = 14;
const SCHEDULE_PAGE_SIZE = 100;
const SCHEDULE_MAX_PAGES = 5;
const schedulePage = pageSchema(scheduleShowtimeSchema);

/** GET /showtimes for today and the next 13 days (Lagos days, as the API's filters use) */
export async function readSchedule(): Promise<ScheduleShowtime[] | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Schedule", async () => {
    const now = Date.now();
    const params = {
      from: dayKey(now, HOME_TIME_ZONE),
      to: dayKey(now + (SCHEDULE_DAYS - 1) * 86_400_000, HOME_TIME_ZONE),
      pageSize: SCHEDULE_PAGE_SIZE,
    };
    const items: ScheduleShowtime[] = [];
    // Every page, up to a sane limit
    for (let page = 1; page <= SCHEDULE_MAX_PAGES; page++) {
      const result = schedulePage.parse(
        await httpServer({ url: "/showtimes", params: { ...params, page } }),
      );
      items.push(...result.items);
      if (!result.meta.hasNextPage) break;
    }
    return items;
  });
}

/** GET /showtimes/:id/capacity: the four rooms with their full price breakdowns */
export async function readCapacity(showtimeId: string): Promise<ShowtimeCapacity | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Rooms", async () =>
    showtimeCapacitySchema.parse(
      await httpServer({ url: `/showtimes/${encodeURIComponent(showtimeId)}/capacity` }),
    ),
  );
}
