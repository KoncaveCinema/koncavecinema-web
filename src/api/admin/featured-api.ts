import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../http";
import {
  featuredPlacementsSchema,
  type FeaturedPlacement,
  type FeaturedPlacementInput,
} from "./featured-schemas";

/*
 * The home page's featured films (koncavecinema-api docs/phases: phase-05b, §2.4a), each call
 * parsing its reply, and their hooks. Every write also refreshes the public home page
 * (refetch.ts).
 */

const placement = (id: string) => `/admin/featured/${encodeURIComponent(id)}`;

/** GET /admin/featured: running and scheduled placements in position order */
export async function listFeatured() {
  return featuredPlacementsSchema.parse(await http({ url: "/admin/featured" }));
}

/** PUT /admin/featured/lineup: these films, in order, become the everyday lineup; [] clears it */
export async function setFeaturedLineup(movieIds: string[]) {
  return featuredPlacementsSchema.parse(
    await http({ url: "/admin/featured/lineup", method: "PUT", data: { movieIds } }),
  );
}

/** POST /admin/featured */
export async function createPlacement(input: FeaturedPlacementInput) {
  await http({ url: "/admin/featured", method: "POST", data: input });
}

/** PATCH /admin/featured/:id */
export async function updatePlacement({
  id,
  input,
}: {
  id: string;
  input: Omit<FeaturedPlacementInput, "movieId">;
}) {
  await http({ url: placement(id), method: "PATCH", data: input });
}

/** DELETE /admin/featured/:id */
export async function removePlacement(id: string) {
  await http({ url: placement(id), method: "DELETE" });
}

/* Hooks. The query waits for `enabled` (a member of staff signed in). */

export function useFeatured(enabled: boolean) {
  return useQuery({ queryKey: ["/admin/featured"], queryFn: listFeatured, enabled });
}

/** The reply is the new lineup: it replaces the cached one at once, with no refetch */
export function useSetFeaturedLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["setFeaturedLineup"],
    mutationFn: setFeaturedLineup,
    onSuccess: (lineup) =>
      queryClient.setQueryData<FeaturedPlacement[]>(["/admin/featured"], (placements) => [
        ...lineup,
        ...(placements ?? []).filter((placement) => placement.kind === "DATED"),
      ]),
  });
}

export function useCreatePlacement() {
  return useMutation({ mutationKey: ["createFeaturedPlacement"], mutationFn: createPlacement });
}

export function useUpdatePlacement() {
  return useMutation({ mutationKey: ["updateFeaturedPlacement"], mutationFn: updatePlacement });
}

export function useRemovePlacement() {
  return useMutation({ mutationKey: ["removeFeaturedPlacement"], mutationFn: removePlacement });
}
