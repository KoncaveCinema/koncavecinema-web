"use client";

import { useQuery } from "@tanstack/react-query";

import { useStaffSignedIn } from "../require-staff";
import { getOverview } from "./service";

export const overviewKeys = {
  overview: () => ["admin", "overview"] as const,
};

/** The admin home's figures. Waits for a member of staff, so nothing is asked without one. */
export function useOverview() {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: overviewKeys.overview(),
    queryFn: getOverview,
    enabled: staff,
  });
}
