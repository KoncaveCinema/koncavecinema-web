import { api, type Paginated } from "@/api";

import type {
  AdminShowtime,
  AdminShowtimeListItem,
  ShowtimeCancellation,
  ShowtimeFilter,
  ShowtimeInput,
} from "./api-types";

/* The admin showtime calls, one function per endpoint. */

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
  return api.getPage<AdminShowtimeListItem>("/admin/showtimes", { params: query });
}

export function getShowtime(id: string): Promise<AdminShowtime> {
  return api.get<AdminShowtime>(`/admin/showtimes/${id}`);
}

export function createShowtime(input: ShowtimeInput): Promise<{ id: string }> {
  return api.post<{ id: string }>("/admin/showtimes", input);
}

export async function updateShowtime(
  id: string,
  input: Omit<ShowtimeInput, "movieId">,
): Promise<void> {
  await api.patch(`/admin/showtimes/${id}`, input);
}

export function cancelShowtime(id: string, reason: string): Promise<ShowtimeCancellation> {
  return api.post<ShowtimeCancellation>(`/admin/showtimes/${id}/cancel`, { reason });
}
