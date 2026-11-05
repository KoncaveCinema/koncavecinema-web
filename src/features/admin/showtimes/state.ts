import { screeningOverAt } from "@/lib/screening-window";

import type { ShowtimeState } from "./api-types";

/** UPCOMING, LIVE (until its latest room's cutoff), PAST or CANCELLED: the API's rule */
export function showtimeStateAt(
  showtime: { startTime: string; endTime: string; cancelledAt: string | null },
  now = Date.now(),
): ShowtimeState {
  if (showtime.cancelledAt) return "CANCELLED";
  if (Date.parse(showtime.startTime) > now) return "UPCOMING";
  return now < screeningOverAt(showtime) ? "LIVE" : "PAST";
}
