import { ErrorCode, type Paginated } from "@/api";
import { demoDelay, demoError } from "@/lib/demo";
import { screeningOverAt } from "@/lib/screening-window";

import {
  filmReadiness,
  filmStatus,
  isPaid,
  paginate,
  readStore,
  showtimeState,
  recordAudit,
  writeStore,
  keptPayment,
  type AdminStore,
  type DemoFilm,
  type DemoVideo,
} from "../demo-store";
import type {
  AdminFilm,
  AdminFilmListItem,
  AdminVideo,
  CertificateInput,
  DirectUpload,
  FilmInput,
  PosterKind,
  PosterUploadSignature,
  StoredPoster,
  VideoAsset,
  VideoKind,
} from "./api-types";

/*
 * The film catalogue demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): each admin endpoint as the API
 * answers it, on the admin demo store. Uploads never leave the browser: a poster is kept as a
 * small copy of the chosen image, and a video "processes" for a few seconds before it's ready
 * (a file named with "fail" fails, to show that state).
 */

const round2 = (value: number) => Math.round(value * 100) / 100;

function filmOrThrow(store: AdminStore, id: string): DemoFilm {
  const film = store.films.find((item) => item.id === id);
  if (!film) throw demoError(ErrorCode.NOT_FOUND, `Movie with ID '${id}' not found.`, 404);
  return film;
}

function slugify(title: string, store: AdminStore): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = base;
  for (let n = 2; store.films.some((film) => film.slug === slug); n++) slug = `${base}-${n}`;
  return slug;
}

function toAdminVideo(film: DemoFilm, video: DemoVideo): AdminVideo {
  return {
    id: video.id,
    kind: video.kind,
    status: video.status,
    isDrmProtected: video.isDrmProtected,
    durationSeconds: video.durationSeconds,
    maxResolution: video.maxResolution,
    errorMessage: video.errorMessage,
    isAttached:
      video.id === film.masterVideoAssetId ||
      Boolean(video.playbackId && film.trailerStreamUrl.includes(video.playbackId)),
    createdAt: video.createdAt,
  };
}

const passesOf = (store: AdminStore, filmId: string) => {
  const showtimes = new Set(
    store.showtimes.filter((st) => st.movieId === filmId).map((st) => st.id),
  );
  return store.passes.filter((pass) => showtimes.has(pass.showtimeId));
};

export async function listFilms(query: {
  status?: "draft" | "published";
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminFilmListItem>> {
  await demoDelay(300);
  const store = readStore();
  const now = Date.now();
  const q = query.q?.trim().toLowerCase();
  const films = store.films
    .filter((film) => !query.status || film.isPublished === (query.status === "published"))
    .filter(
      (film) =>
        !q || film.title.toLowerCase().includes(q) || film.producerName.toLowerCase().includes(q),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const items = films.map((film): AdminFilmListItem => {
    const videos = store.videos.filter((video) => video.movieId === film.id);
    const master = videos.find((video) => video.id === film.masterVideoAssetId);
    const latestTrailer = videos
      .filter((video) => video.kind === "TRAILER")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    const next = store.showtimes
      .filter((st) => st.movieId === film.id && !st.cancelledAt && Date.parse(st.endTime) > now)
      .map((st) => st.startTime)
      .sort()[0];
    return {
      id: film.id,
      title: film.title,
      slug: film.slug,
      producerName: film.producerName,
      status: filmStatus(film),
      posterPortrait: film.posterPortrait || null,
      certified: Boolean(film.nfvcbCertNumber),
      master: master ? { status: master.status, drmProtected: master.isDrmProtected } : null,
      trailer: film.trailerStreamUrl ? "ATTACHED" : (latestTrailer?.status ?? "NONE"),
      nextShowtimeAt: next ?? null,
      ticketsSold: passesOf(store, film.id).filter(isPaid).length,
      createdAt: film.createdAt,
    };
  });
  return paginate(items, query.page, query.pageSize);
}

export async function getFilm(id: string): Promise<AdminFilm> {
  await demoDelay(300);
  const store = readStore();
  const film = filmOrThrow(store, id);
  const passes = passesOf(store, id);
  const ticketIds = new Set(passes.map((pass) => pass.id));
  const kept = store.payments.filter(
    (payment) => ticketIds.has(payment.ticketId) && keptPayment(payment),
  );
  const sum = (pick: (s: NonNullable<(typeof kept)[number]["settlement"]>) => number) =>
    round2(kept.reduce((total, payment) => total + pick(payment.settlement!), 0));

  return {
    ...film,
    status: filmStatus(film),
    readiness: filmReadiness(film),
    // Any settled payment, refunded or not, fixes the split
    producerSplitLocked: store.payments.some(
      (payment) => ticketIds.has(payment.ticketId) && payment.settlement !== null,
    ),
    videos: store.videos
      .filter((video) => video.movieId === id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((video) => toAdminVideo(film, video)),
    showtimes: store.showtimes
      .filter((st) => st.movieId === id)
      .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime))
      .map((st) => ({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        basePrice: st.basePrice,
        currency: st.currency,
        cancelledAt: st.cancelledAt,
        ticketsSold: passes.filter((pass) => pass.showtimeId === st.id && isPaid(pass)).length,
        state: showtimeState(st),
      })),
    revenue: {
      gross: sum((s) => s.gross),
      gatewayFees: sum((s) => s.gatewayFee),
      producerShare: sum((s) => s.producer),
      platformShare: sum((s) => s.platform),
    },
  };
}

export async function createFilm(input: FilmInput): Promise<{ id: string }> {
  await demoDelay();
  const store = readStore();
  const now = new Date().toISOString();
  const film: DemoFilm = {
    id: crypto.randomUUID(),
    slug: slugify(input.title, store),
    title: input.title,
    synopsis: input.synopsis,
    durationMinutes: input.durationMinutes,
    ageRating: input.ageRating,
    producerName: input.producerName,
    producerRevenueSplit: input.producerRevenueSplit ?? 85,
    watermarkMode: input.watermarkMode ?? "SUBTLE",
    nfvcbCertNumber: null,
    nfvcbCertUrl: null,
    posterLandscape: "",
    posterPortrait: "",
    trailerStreamUrl: "",
    masterVideoAssetId: null,
    isPublished: false,
    announcedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.films.push(film);
  writeStore(store);
  return { id: film.id };
}

export async function updateFilm(id: string, input: FilmInput): Promise<void> {
  await demoDelay();
  const store = readStore();
  Object.assign(filmOrThrow(store, id), {
    ...input,
    updatedAt: new Date().toISOString(),
  });
  writeStore(store);
}

export async function setCertificate(id: string, input: CertificateInput): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, id);
  if (
    store.films.some((other) => other.id !== id && other.nfvcbCertNumber === input.nfvcbCertNumber)
  ) {
    throw demoError(
      ErrorCode.CERTIFICATE_ALREADY_BOUND,
      "This NFVCB certificate number is already bound to another film.",
      409,
    );
  }
  Object.assign(film, input, { updatedAt: new Date().toISOString() });
  writeStore(store);
}

/** The API's publishing checks, in its order */
export async function publishFilm(id: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, id);
  if (!film.nfvcbCertNumber || !film.nfvcbCertUrl) {
    throw demoError(ErrorCode.MOVIE_NOT_CERTIFIED, "Missing NFVCB certificate.");
  }
  if (!film.masterVideoAssetId) {
    throw demoError(ErrorCode.MOVIE_MISSING_MASTER_ASSET, "No master video attached.");
  }
  if (!film.trailerStreamUrl) {
    throw demoError(ErrorCode.MOVIE_MISSING_TRAILER, "No trailer attached.");
  }
  film.isPublished = true;
  film.updatedAt = new Date().toISOString();
  writeStore(store);
}

export async function unpublishFilm(id: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, id);
  const now = Date.now();
  const upcoming = new Set(
    store.showtimes
      .filter((st) => st.movieId === id && !st.cancelledAt && screeningOverAt(st) > now)
      .map((st) => st.id),
  );
  const paidPasses = store.passes.filter(
    (pass) => upcoming.has(pass.showtimeId) && isPaid(pass),
  ).length;
  if (paidPasses > 0) {
    throw demoError(
      ErrorCode.MOVIE_HAS_ACTIVE_SALES,
      "Members hold paid passes for screenings still to come. Cancel those showtimes first.",
      409,
      { paidPasses },
    );
  }
  film.isPublished = false;
  recordAudit(store, "ADMIN_MOVIE_UNPUBLISHED", { movieId: id, slug: film.slug });
  writeStore(store);
}

export async function deleteFilm(id: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, id);
  if (film.isPublished || store.showtimes.some((st) => st.movieId === id)) {
    throw demoError(
      ErrorCode.MOVIE_ALREADY_PUBLISHED,
      "Only drafts that were never scheduled can be deleted. Unpublish the film instead.",
      409,
    );
  }
  store.films = store.films.filter((item) => item.id !== id);
  store.videos = store.videos.filter((video) => video.movieId !== id);
  recordAudit(store, "ADMIN_MOVIE_DELETED", { movieId: id, title: film.title });
  writeStore(store);
}

/* Posters */

export async function signPosterUpload(movieId: string): Promise<PosterUploadSignature> {
  await demoDelay(200);
  filmOrThrow(readStore(), movieId);
  return {
    uploadUrl: "https://demo.invalid/image/upload",
    fields: {},
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    maxBytes: 5 * 1024 * 1024,
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    simulated: true,
  };
}

/** A small copy of the chosen image, so the demo poster survives a reload within the tab */
async function shrink(
  file: File,
  maxWidth: number,
): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { url: canvas.toDataURL("image/jpeg", 0.78), width: bitmap.width, height: bitmap.height };
}

export async function completePosterUpload(
  movieId: string,
  kind: PosterKind,
  file: File,
): Promise<StoredPoster> {
  const image = await shrink(file, kind === "POSTER_LANDSCAPE" ? 960 : 480);
  const store = readStore();
  const film = filmOrThrow(store, movieId);
  if (kind === "POSTER_LANDSCAPE") film.posterLandscape = image.url;
  else film.posterPortrait = image.url;
  recordAudit(store, "ADMIN_POSTER_UPLOADED", {
    movieId,
    kind,
    width: image.width,
    height: image.height,
  });
  writeStore(store);
  return { kind, url: image.url, width: image.width, height: image.height };
}

/* Videos */

export async function createDirectUpload(movieId: string, kind: VideoKind): Promise<DirectUpload> {
  await demoDelay(300);
  const store = readStore();
  const film = filmOrThrow(store, movieId);
  if (kind === "MASTER" && film.isPublished) {
    throw demoError(
      ErrorCode.MOVIE_ALREADY_PUBLISHED,
      "A published film's master can't be replaced.",
      409,
    );
  }
  const now = new Date().toISOString();
  const video: DemoVideo = {
    id: crypto.randomUUID(),
    movieId,
    kind,
    status: "UPLOADING",
    playbackId: null,
    isDrmProtected: false,
    durationSeconds: null,
    maxResolution: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
  store.videos.push(video);
  writeStore(store);
  return {
    videoAssetId: video.id,
    uploadUrl: `https://demo.invalid/upload/${video.id}`,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    drmProtected: false,
    simulated: true,
  };
}

/** Demo only: the file has arrived at "Mux", which takes a few seconds to process it */
export function finishVideoUpload(videoId: string, fileName: string) {
  const store = readStore();
  const video = store.videos.find((item) => item.id === videoId);
  if (!video) return;
  video.status = "PROCESSING";
  video.finishesAt = Date.now() + 8_000;
  video.fails = /fail/i.test(fileName);
  video.updatedAt = new Date().toISOString();
  writeStore(store);
}

/** Demo only: an upload abandoned before it finished */
export function cancelVideoUpload(videoId: string) {
  const store = readStore();
  const video = store.videos.find((item) => item.id === videoId);
  if (!video) return;
  video.status = "CANCELLED";
  writeStore(store);
}

export async function getVideo(id: string): Promise<VideoAsset> {
  await demoDelay(150);
  const video = readStore().videos.find((item) => item.id === id);
  if (!video) throw demoError(ErrorCode.NOT_FOUND, "Video not found.", 404);
  return {
    id: video.id,
    movieId: video.movieId,
    kind: video.kind,
    status: video.status,
    isDrmProtected: video.isDrmProtected,
    durationSeconds: video.durationSeconds,
    maxResolution: video.maxResolution,
    errorMessage: video.errorMessage,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}

function readyVideo(store: AdminStore, movieId: string, videoId: string, kind: VideoKind) {
  const video = store.videos.find((item) => item.id === videoId && item.movieId === movieId);
  if (!video) throw demoError(ErrorCode.NOT_FOUND, "Video not found.", 404);
  if (video.kind !== kind) {
    throw demoError(ErrorCode.VIDEO_ASSET_WRONG_KIND, `This upload isn't a ${kind.toLowerCase()}.`);
  }
  if (video.status !== "READY") {
    throw demoError(ErrorCode.CONFLICT, "This upload hasn't finished processing.", 409);
  }
  return video;
}

export async function attachMaster(movieId: string, videoId: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, movieId);
  if (film.isPublished) {
    throw demoError(
      ErrorCode.MOVIE_ALREADY_PUBLISHED,
      "A published film's master can't be replaced.",
      409,
    );
  }
  const video = readyVideo(store, movieId, videoId, "MASTER");
  film.masterVideoAssetId = video.id;
  // The API takes the runtime from the video itself
  if (video.durationSeconds) film.durationMinutes = Math.round(video.durationSeconds / 60);
  writeStore(store);
}

export async function attachTrailer(movieId: string, videoId: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const film = filmOrThrow(store, movieId);
  const video = readyVideo(store, movieId, videoId, "TRAILER");
  film.trailerStreamUrl = `https://stream.mux.com/${video.playbackId}.m3u8`;
  writeStore(store);
}

export async function deleteVideo(videoId: string): Promise<void> {
  await demoDelay();
  const store = readStore();
  const video = store.videos.find((item) => item.id === videoId);
  if (!video) throw demoError(ErrorCode.NOT_FOUND, "Video not found.", 404);
  const film = filmOrThrow(store, video.movieId);
  if (toAdminVideo(film, video).isAttached) {
    throw demoError(
      ErrorCode.VIDEO_ASSET_IN_USE,
      "The attached master and current trailer can't be deleted.",
      409,
    );
  }
  store.videos = store.videos.filter((item) => item.id !== videoId);
  writeStore(store);
}
