import { z } from "zod";

import { filmStatusSchema } from "./films-schemas";

/*
 * The home page's featured films as staff manage them, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f) and §2.4a of its admin module doc.
 */

/** Why a placement isn't on the home page right now */
export const hiddenReasonSchema = z.enum([
  "ENDED",
  "NOT_STARTED",
  "FILM_NOT_PUBLIC",
  "NO_OPEN_SCREENING",
  "DATED_PLACEMENT_RUNNING",
  "FILM_SHOWN_HIGHER",
]);
export type HiddenReason = z.infer<typeof hiddenReasonSchema>;

/** One placement from GET /admin/featured */
export const featuredPlacementSchema = z.object({
  id: z.string(),
  /** 1 to 5, 1 first */
  position: z.number(),
  /** EVERYDAY: the standing lineup, no end. DATED: takes its position over while it runs */
  kind: z.enum(["EVERYDAY", "DATED"]),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
  /** On the home page right now */
  live: z.boolean(),
  hiddenReason: hiddenReasonSchema.nullable(),
  film: z.object({
    id: z.string(),
    title: z.string(),
    status: filmStatusSchema,
    posterPortrait: z.string(),
  }),
});
export type FeaturedPlacement = z.infer<typeof featuredPlacementSchema>;

export const featuredPlacementsSchema = z.array(featuredPlacementSchema);

/** POST /admin/featured: a dated placement (without `endsAt` it joins the everyday lineup) */
export interface FeaturedPlacementInput {
  movieId: string;
  position: number;
  startsAt?: string;
  endsAt?: string;
}
