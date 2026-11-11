import { api, type Paginated } from "@/api";
import { isDemo } from "@/lib/demo";

import type {
  AdminShowtime,
  AdminShowtimeListItem,
  ShowtimeCancellation,
  ShowtimeFilter,
  ShowtimeInput,
} from "./api-types";
import * as demo from "./demo";

/* The admin showtime calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a
   demo plays the API's part. */

export interface ShowtimesQuery {
  movieId?: string;
  /** Lagos days, YYYY-MM-DD, at most 31 apart */
  from?: string;
  to?: string;
  status?: ShowtimeFilter;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

export function listShowtimes(query: ShowtimesQuery): Promise<Paginated<AdminShowtimeListItem>> {
  if (isDemo) return demo.listShowtimes(query);
  return api.getPage<AdminShowtimeListItem>("/admin/showtimes", { params: query });
}

export function getShowtime(id: string): Promise<AdminShowtime> {
  if (isDemo) return demo.getShowtime(id);
  return api.get<AdminShowtime>(`/admin/showtimes/${id}`);
}

export function createShowtime(input: ShowtimeInput): Promise<{ id: string }> {
  if (isDemo) return demo.createShowtime(input);
  return api.post<{ id: string }>("/admin/showtimes", input);
}

export async function updateShowtime(
  id: string,
  input: Omit<ShowtimeInput, "movieId">,
): Promise<void> {
  if (isDemo) return demo.updateShowtime(id, input);
  await api.patch(`/admin/showtimes/${id}`, input);
}

export function cancelShowtime(id: string, reason: string): Promise<ShowtimeCancellation> {
  if (isDemo) return demo.cancelShowtime(id, reason);
  return api.post<ShowtimeCancellation>(`/admin/showtimes/${id}/cancel`, { reason });
}
