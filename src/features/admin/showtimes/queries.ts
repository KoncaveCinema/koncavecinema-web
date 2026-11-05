"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useStaffSignedIn } from "../require-staff";
import { useRefreshAdmin } from "../use-refresh-admin";
import type { ShowtimeInput } from "./api-types";
import {
  cancelShowtime,
  createShowtime,
  getShowtime,
  listShowtimes,
  updateShowtime,
  type ShowtimesQuery,
} from "./service";

export const showtimeKeys = {
  list: (query: ShowtimesQuery) => ["admin", "showtimes", "list", query] as const,
  showtime: (id: string) => ["admin", "showtimes", id] as const,
};

export function useShowtimes(query: ShowtimesQuery) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: showtimeKeys.list(query),
    queryFn: () => listShowtimes(query),
    enabled: staff,
    placeholderData: (previous) => previous,
  });
}

export function useShowtime(id: string) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: showtimeKeys.showtime(id),
    queryFn: () => getShowtime(id),
    enabled: staff,
    retry: false,
  });
}

export function useCreateShowtime() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: createShowtime, onSuccess: refresh });
}

export function useUpdateShowtime() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Omit<ShowtimeInput, "movieId"> }) =>
      updateShowtime(id, input),
    onSuccess: refresh,
  });
}

export function useCancelShowtime() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelShowtime(id, reason),
    onSuccess: refresh,
  });
}
