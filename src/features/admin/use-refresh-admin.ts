"use client";

import { useQueryClient } from "@tanstack/react-query";

/**
 * After an admin write: every admin query is refreshed. Their keys all start with "admin", and
 * a write's effects cross screens (a cancelled showtime changes the film page, the refunds queue
 * and the overview), so the console never shows a figure the write has made stale.
 */
export function useRefreshAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin"] });
}
