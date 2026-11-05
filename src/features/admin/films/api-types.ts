import type { AgeRating, FilmStatus } from "@/types/domain";

import type { ShowtimeState } from "../showtimes/api-types";

/** koncavecinema-api admin catalogue shapes, field for field (src/admin/catalog.service.ts). */

export type { FilmStatus };
export type WatermarkMode = "OFF" | "SUBTLE" | "STRONG";
export type VideoKind = "MASTER" | "TRAILER";
export type VideoStatus = "UPLOADING" | "PROCESSING" | "READY" | "ERRORED" | "CANCELLED";
export type PosterKind = "POSTER_PORTRAIT" | "POSTER_LANDSCAPE";

/** One row of GET /admin/movies */
export interface AdminFilmListItem {
  id: string;
  title: string;
  slug: string;
  producerName: string;
  status: FilmStatus;
  posterPortrait: string | null;
  certified: boolean;
  master: { status: VideoStatus; drmProtected: boolean } | null;
  /** ATTACHED, the latest trailer upload's status, or NONE */
  trailer: "ATTACHED" | VideoStatus | "NONE";
  nextShowtimeAt: string | null;
  ticketsSold: number;
  createdAt: string;
}

/** One upload made for a film, on the film page */
export interface AdminVideo {
  id: string;
  kind: VideoKind;
  status: VideoStatus;
  isDrmProtected: boolean;
  durationSeconds: number | null;
  maxResolution: string | null;
  errorMessage: string | null;
  isAttached: boolean;
  createdAt: string;
}

/** GET /admin/movies/:id: the film with what it still needs, its uploads, showtimes and money */
export interface AdminFilm {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  nfvcbCertNumber: string | null;
  nfvcbCertUrl: string | null;
  /** Empty until a trailer is attached */
  trailerStreamUrl: string;
  masterVideoAssetId: string | null;
  watermarkMode: WatermarkMode;
  posterLandscape: string;
  posterPortrait: string;
  producerName: string;
  /** A Prisma decimal: arrives as a string */
  producerRevenueSplit: string | number;
  isPublished: boolean;
  /** When it was announced as coming soon; null for a draft never announced */
  announcedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: FilmStatus;
  /**
   * What the announce and publish rules need. The buttons follow canAnnounce and canPublish;
   * the other four only say what is missing.
   */
  readiness: {
    certified: boolean;
    masterAttached: boolean;
    trailer: boolean;
    posters: boolean;
    canAnnounce: boolean;
    canPublish: boolean;
  };
  /** True once any payment for the film has been settled, refunded or not (PATCH refuses then) */
  producerSplitLocked: boolean;
  videos: AdminVideo[];
  showtimes: {
    id: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    currency: string;
    cancelledAt: string | null;
    ticketsSold: number;
    /** The API's rule, as on GET /admin/showtimes; never worked out from `endTime` */
    state: ShowtimeState;
  }[];
  revenue: { gross: number; gatewayFees: number; producerShare: number; platformShare: number };
}

/**
 * POST /admin/movies and PATCH /admin/movies/:id: these fields only. Posters come from the
 * uploads and the trailer from an attached upload; sending them is a 400.
 */
export interface FilmInput {
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  producerRevenueSplit?: number;
  watermarkMode?: WatermarkMode;
}

/** PATCH /admin/movies/:id/unpublish: back to DRAFT, from PUBLISHED or COMING_SOON */
export interface UnpublishedFilm {
  id: string;
  isPublished: boolean;
  status: FilmStatus;
}

/** PATCH /admin/movies/:id/compliance */
export interface CertificateInput {
  nfvcbCertNumber: string;
  nfvcbCertUrl: string;
}

/** POST /admin/uploads/images: a signed poster upload, sent straight to the image host */
export interface PosterUploadSignature {
  uploadUrl: string;
  /** Sent with the file exactly as given: they are what the signature covers */
  fields: Record<string, string>;
  expiresAt: string;
  maxBytes: number;
  allowedFormats: string[];
  /** True without image-host credentials (never in production): nothing accepts the file */
  simulated: boolean;
}

/** POST /admin/uploads/images/complete */
export interface StoredPoster {
  kind: PosterKind;
  url: string;
  width: number;
  height: number;
}

/** POST /admin/videos/direct-upload: a resumable upload address at Mux */
export interface DirectUpload {
  videoAssetId: string;
  uploadUrl: string;
  expiresAt: string;
  drmProtected: boolean;
  simulated: boolean;
}

/** GET /admin/videos/:id: one upload's progress at Mux */
export interface VideoAsset {
  id: string;
  movieId: string | null;
  kind: VideoKind;
  status: VideoStatus;
  isDrmProtected: boolean;
  durationSeconds: number | null;
  maxResolution: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
