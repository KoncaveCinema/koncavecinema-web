import { z } from "zod";

import { pageSchema } from "../page-schema";
import { ageRatingSchema } from "../showtimes/showtimes-schemas";
import { showtimeStateSchema } from "./showtimes-schemas";

/*
 * The admin catalogue replies the console reads, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f).
 */

export const filmStatusSchema = z.enum(["DRAFT", "COMING_SOON", "PUBLISHED"]);
export type FilmStatus = z.infer<typeof filmStatusSchema>;

export const watermarkModeSchema = z.enum(["OFF", "SUBTLE", "STRONG"]);
export type WatermarkMode = z.infer<typeof watermarkModeSchema>;

export const videoKindSchema = z.enum(["MASTER", "TRAILER"]);
export type VideoKind = z.infer<typeof videoKindSchema>;

export const videoStatusSchema = z.enum([
  "UPLOADING",
  "PROCESSING",
  "READY",
  "ERRORED",
  "CANCELLED",
]);
export type VideoStatus = z.infer<typeof videoStatusSchema>;

export type PosterKind = "POSTER_PORTRAIT" | "POSTER_LANDSCAPE";

/** One row of GET /admin/movies */
export const adminFilmListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  producerName: z.string(),
  status: filmStatusSchema,
  posterPortrait: z.string().nullable(),
  certified: z.boolean(),
  master: z.object({ status: videoStatusSchema, drmProtected: z.boolean() }).nullable(),
  /** ATTACHED, the latest trailer upload's status, or NONE */
  trailer: z.union([z.literal("ATTACHED"), videoStatusSchema, z.literal("NONE")]),
  nextShowtimeAt: z.iso.datetime().nullable(),
  ticketsSold: z.number(),
  createdAt: z.iso.datetime(),
});
export type AdminFilmListItem = z.infer<typeof adminFilmListItemSchema>;
export const adminFilmPageSchema = pageSchema(adminFilmListItemSchema);

/** One upload made for a film, on the film page */
export const adminVideoSchema = z.object({
  id: z.string(),
  kind: videoKindSchema,
  status: videoStatusSchema,
  isDrmProtected: z.boolean(),
  durationSeconds: z.number().nullable(),
  maxResolution: z.string().nullable(),
  errorMessage: z.string().nullable(),
  isAttached: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type AdminVideo = z.infer<typeof adminVideoSchema>;

/** GET /admin/movies/:id: the film with what it still needs, its uploads, showtimes and money */
export const adminFilmSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  synopsis: z.string(),
  durationMinutes: z.number(),
  ageRating: ageRatingSchema,
  nfvcbCertNumber: z.string().nullable(),
  nfvcbCertUrl: z.string().nullable(),
  /** Empty until a trailer is attached */
  trailerStreamUrl: z.string(),
  masterVideoAssetId: z.string().nullable(),
  watermarkMode: watermarkModeSchema,
  posterLandscape: z.string(),
  posterPortrait: z.string(),
  producerName: z.string(),
  // A decimal in the database: a number in the spec, a string from older builds
  producerRevenueSplit: z.union([z.number(), z.string()]).transform(Number),
  /** When it was announced as coming soon; null for a draft never announced */
  announcedAt: z.iso.datetime().nullable(),
  status: filmStatusSchema,
  /**
   * What the announce and publish rules need. The buttons follow canAnnounce and canPublish;
   * the other four say what is missing.
   */
  readiness: z.object({
    certified: z.boolean(),
    masterAttached: z.boolean(),
    trailer: z.boolean(),
    posters: z.boolean(),
    canAnnounce: z.boolean(),
    canPublish: z.boolean(),
  }),
  /** True once a pass for the film has been paid: the producer's share can't change then */
  producerSplitLocked: z.boolean(),
  videos: z.array(adminVideoSchema),
  showtimes: z.array(
    z.object({
      id: z.string(),
      startTime: z.iso.datetime(),
      endTime: z.iso.datetime(),
      basePrice: z.number(),
      currency: z.string(),
      cancelledAt: z.iso.datetime().nullable(),
      ticketsSold: z.number(),
      /** The API's rule, as on GET /admin/showtimes; never worked out from `endTime` */
      state: showtimeStateSchema,
    }),
  ),
  revenue: z.object({
    gross: z.number(),
    gatewayFees: z.number(),
    producerShare: z.number(),
    platformShare: z.number(),
  }),
});
export type AdminFilm = z.infer<typeof adminFilmSchema>;

/** POST /admin/movies: the new draft (only its id is used) */
export const createdFilmSchema = z.object({ id: z.string() });

/**
 * POST /admin/movies and PATCH /admin/movies/:id: these fields only. Posters come from the
 * uploads and the trailer from an attached upload; sending them is a 400.
 */
export interface FilmInput {
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: z.infer<typeof ageRatingSchema>;
  producerName: string;
  producerRevenueSplit?: number;
  watermarkMode?: WatermarkMode;
}

/** PATCH /admin/movies/:id/compliance */
export interface CertificateInput {
  nfvcbCertNumber: string;
  nfvcbCertUrl: string;
}

/** POST /admin/uploads/images: a signed poster upload, sent straight to the image host */
export const posterUploadSignatureSchema = z.object({
  uploadUrl: z.string(),
  /** Sent with the file exactly as given: they are what the signature covers */
  fields: z.record(z.string(), z.string()),
  /** True without image-host credentials (never in production): nothing accepts the file */
  simulated: z.boolean(),
});

/** POST /admin/uploads/images/complete */
export const storedPosterSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

/** POST /admin/videos/direct-upload: a resumable upload address at Mux */
export const directUploadSchema = z.object({
  videoAssetId: z.string(),
  uploadUrl: z.string(),
  simulated: z.boolean(),
});
export type DirectUpload = z.infer<typeof directUploadSchema>;

/** GET /admin/videos/:id: one upload's progress at Mux */
export const videoAssetSchema = z.object({
  id: z.string(),
  kind: videoKindSchema,
  status: videoStatusSchema,
  durationSeconds: z.number().nullable(),
  maxResolution: z.string().nullable(),
  errorMessage: z.string().nullable(),
});
export type VideoAsset = z.infer<typeof videoAssetSchema>;
