import { useMutation, useQuery } from "@tanstack/react-query";

import { http } from "../http";
import {
  adminShowtimePageSchema,
  adminShowtimeSchema,
  showtimeCancellationSchema,
  type ShowtimeFilter,
  type ShowtimeInput,
} from "./showtimes-schemas";

/*
 * The admin showtime calls (koncavecinema-api docs/phases: phase-05b, §2.5), each parsing its
 * reply, and their hooks.
 */

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

const showtime = (id: string) => `/admin/showtimes/${encodeURIComponent(id)}`;

/** GET /admin/showtimes */
export async function listShowtimes(query: ShowtimesQuery) {
  return adminShowtimePageSchema.parse(await http({ url: "/admin/showtimes", params: query }));
}

/** GET /admin/showtimes/:id */
export async function getShowtime(id: string) {
  return adminShowtimeSchema.parse(await http({ url: showtime(id) }));
}

/** POST /admin/showtimes: the API sets the end from the film's runtime */
export async function createShowtime(input: ShowtimeInput) {
  await http({ url: "/admin/showtimes", method: "POST", data: input });
}

/**
 * PATCH /admin/showtimes/:id, before the start only. A new start time emails every member
 * holding a paid pass; price and currency are fixed once one is paid.
 */
export async function updateShowtime({
  id,
  input,
}: {
  id: string;
  input: Omit<ShowtimeInput, "movieId">;
}) {
  await http({ url: showtime(id), method: "PATCH", data: input });
}

/** POST /admin/showtimes/:id/cancel: every pass cancelled, every payment queued for a refund */
export async function cancelShowtime({ id, reason }: { id: string; reason: string }) {
  return showtimeCancellationSchema.parse(
    await http({ url: `${showtime(id)}/cancel`, method: "POST", data: { reason } }),
  );
}

/* Hooks. Each query waits for `enabled` (a member of staff signed in). */

export function useShowtimes(query: ShowtimesQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/showtimes", query],
    queryFn: () => listShowtimes(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useShowtime(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [showtime(id)],
    queryFn: () => getShowtime(id),
    enabled,
    retry: false,
  });
}

export function useCreateShowtime() {
  return useMutation({ mutationKey: ["createShowtime"], mutationFn: createShowtime });
}

export function useUpdateShowtime() {
  return useMutation({ mutationKey: ["updateShowtime"], mutationFn: updateShowtime });
}

export function useCancelShowtime() {
  return useMutation({ mutationKey: ["cancelShowtime"], mutationFn: cancelShowtime });
}
