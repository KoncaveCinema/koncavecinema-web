import { useMutation, useQuery } from "@tanstack/react-query";

import { http } from "../http";
import {
  adminFilmPageSchema,
  adminFilmSchema,
  createdFilmSchema,
  directUploadSchema,
  posterUploadSignatureSchema,
  storedPosterSchema,
  videoAssetSchema,
  type CertificateInput,
  type DirectUpload,
  type FilmInput,
  type PosterKind,
  type VideoKind,
} from "./films-schemas";

/*
 * The admin catalogue's calls (koncavecinema-api docs/phases: phase-05b, §2.4), each parsing its
 * reply, and their hooks; plus the two uploads that go straight from the browser to the media
 * hosts (posters to the image host, videos to Mux).
 */

export interface FilmsQuery {
  status?: "draft" | "coming_soon" | "published";
  q?: string;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

/** Every film for a picker: the API's largest page */
export const ALL_FILMS: FilmsQuery = { pageSize: 100 };

const film = (id: string) => `/admin/movies/${encodeURIComponent(id)}`;

/** GET /admin/movies */
export async function listFilms(query: FilmsQuery) {
  return adminFilmPageSchema.parse(await http({ url: "/admin/movies", params: query }));
}

/** GET /admin/movies/:id */
export async function getFilm(id: string) {
  return adminFilmSchema.parse(await http({ url: film(id) }));
}

/** POST /admin/movies: a new draft */
export async function createFilm(input: FilmInput) {
  return createdFilmSchema.parse(await http({ url: "/admin/movies", method: "POST", data: input }));
}

/** PATCH /admin/movies/:id */
export async function updateFilm({ id, input }: { id: string; input: FilmInput }) {
  await http({ url: film(id), method: "PATCH", data: input });
}

/** PATCH /admin/movies/:id/compliance */
export async function setCertificate({ id, input }: { id: string; input: CertificateInput }) {
  await http({ url: `${film(id)}/compliance`, method: "PATCH", data: input });
}

/** PATCH /admin/movies/:id/announce: coming soon (public page and trailer, no screenings) */
export async function announceFilm(id: string) {
  await http({ url: `${film(id)}/announce`, method: "PATCH" });
}

/** PATCH /admin/movies/:id/publish */
export async function publishFilm(id: string) {
  await http({ url: `${film(id)}/publish`, method: "PATCH" });
}

/** PATCH /admin/movies/:id/unpublish: back to draft, from published or coming soon */
export async function unpublishFilm(id: string) {
  await http({ url: `${film(id)}/unpublish`, method: "PATCH" });
}

/** DELETE /admin/movies/:id: a draft never scheduled, with its uploads */
export async function deleteFilm(id: string) {
  await http({ url: film(id), method: "DELETE" });
}

/* Posters: sign, send the file to the image host, then confirm */

/** Moves a progress bar along while a simulated upload "sends" (an API without media keys) */
async function simulateProgress(onProgress: (percent: number) => void, ms = 1200) {
  for (let percent = 10; percent <= 100; percent += 15) {
    onProgress(Math.min(percent, 100));
    await new Promise((resolve) => setTimeout(resolve, ms / 7));
  }
}

/** A multipart upload with progress (fetch can't report upload progress) */
function sendForm(url: string, form: FormData, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status < 300 ? resolve() : reject(new Error(`Upload failed (${request.status})`));
    request.onerror = () => reject(new Error("Upload failed"));
    request.send(form);
  });
}

export interface PosterUpload {
  movieId: string;
  kind: PosterKind;
  file: File;
  onProgress: (percent: number) => void;
}

/**
 * POST /admin/uploads/images, the file to the image host, then POST /admin/uploads/images/complete
 * (which checks the file and stores its link on the film)
 */
export async function uploadPoster({ movieId, kind, file, onProgress }: PosterUpload) {
  const signature = posterUploadSignatureSchema.parse(
    await http({ url: "/admin/uploads/images", method: "POST", data: { movieId, kind } }),
  );
  if (signature.simulated) {
    // No image host behind the signature: the API's docs say to carry on as if it arrived
    await simulateProgress(onProgress);
  } else {
    const form = new FormData();
    for (const [name, value] of Object.entries(signature.fields)) form.append(name, value);
    form.append("file", file);
    await sendForm(signature.uploadUrl, form, onProgress);
  }
  return storedPosterSchema.parse(
    await http({
      url: "/admin/uploads/images/complete",
      method: "POST",
      data: { movieId, kind },
    }),
  );
}

/* Videos: open a direct upload, send the file to Mux in resumable chunks, follow processing */

/** POST /admin/videos/direct-upload */
export async function createDirectUpload(movieId: string, kind: VideoKind): Promise<DirectUpload> {
  return directUploadSchema.parse(
    await http({ url: "/admin/videos/direct-upload", method: "POST", data: { movieId, kind } }),
  );
}

/** A running upload that can be paused, resumed and abandoned */
export interface VideoUploadControl {
  pause: () => void;
  resume: () => void;
  abort: () => void;
  done: Promise<void>;
}

/** Sends the file to Mux's upload address (simulated when the API has no Mux keys) */
export async function sendVideo(
  upload: DirectUpload,
  file: File,
  onProgress: (percent: number) => void,
): Promise<VideoUploadControl> {
  if (upload.simulated) {
    let paused = false;
    let aborted = false;
    const done = (async () => {
      for (let percent = 0; percent <= 100; percent += 4) {
        while (paused && !aborted) await new Promise((resolve) => setTimeout(resolve, 200));
        if (aborted) throw new Error("Upload cancelled");
        onProgress(percent);
        await new Promise((resolve) => setTimeout(resolve, 140));
      }
    })();
    return {
      pause: () => (paused = true),
      resume: () => (paused = false),
      abort: () => {
        aborted = true;
      },
      done,
    };
  }

  // UpChunk loads only when a video is actually sent, so no other page carries it
  const { createUpload } = await import("@mux/upchunk");
  const chunked = createUpload({ endpoint: upload.uploadUrl, file, chunkSize: 30720 });
  const done = new Promise<void>((resolve, reject) => {
    chunked.on("progress", (event) => onProgress(Math.round(event.detail)));
    chunked.on("success", () => resolve());
    chunked.on("error", (event) => reject(new Error(event.detail.message)));
  });
  return {
    pause: () => chunked.pause(),
    resume: () => chunked.resume(),
    abort: () => chunked.abort(),
    done,
  };
}

/** GET /admin/videos/:id: one upload's progress at Mux */
export async function getVideo(id: string) {
  return videoAssetSchema.parse(await http({ url: `/admin/videos/${encodeURIComponent(id)}` }));
}

/** POST /admin/movies/:id/video or /trailer: a READY upload becomes the film's master or trailer */
export async function attachVideo({
  movieId,
  kind,
  videoId,
}: {
  movieId: string;
  kind: VideoKind;
  videoId: string;
}) {
  await http({
    url: `${film(movieId)}/${kind === "MASTER" ? "video" : "trailer"}`,
    method: "POST",
    data: { videoAssetId: videoId },
  });
}

/** DELETE /admin/videos/:id: an unused upload, at Mux too */
export async function deleteVideo(id: string) {
  await http({ url: `/admin/videos/${encodeURIComponent(id)}`, method: "DELETE" });
}

/* Hooks. Each query waits for `enabled` (a member of staff signed in). */

export function useFilms(query: FilmsQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/movies", query],
    queryFn: () => listFilms(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useFilm(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [film(id)],
    queryFn: () => getFilm(id),
    enabled: enabled && id !== "",
    retry: false,
  });
}

/** One upload's progress at Mux: polled every 5 s while it uploads or processes, then stops */
export function useVideoProgress(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [`/admin/videos/${id ?? ""}`],
    queryFn: () => getVideo(id!),
    enabled: enabled && id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "READY" || status === "ERRORED" || status === "CANCELLED" ? false : 5_000;
    },
  });
}

export function useCreateFilm() {
  return useMutation({ mutationKey: ["createMovie"], mutationFn: createFilm });
}

export function useUpdateFilm() {
  return useMutation({ mutationKey: ["updateMovie"], mutationFn: updateFilm });
}

export function useSetCertificate() {
  return useMutation({ mutationKey: ["bindCompliance"], mutationFn: setCertificate });
}

export function useAnnounceFilm() {
  return useMutation({ mutationKey: ["announceMovie"], mutationFn: announceFilm });
}

export function usePublishFilm() {
  return useMutation({ mutationKey: ["publishMovie"], mutationFn: publishFilm });
}

export function useUnpublishFilm() {
  return useMutation({ mutationKey: ["unpublishMovie"], mutationFn: unpublishFilm });
}

export function useDeleteFilm() {
  return useMutation({ mutationKey: ["deleteMovie"], mutationFn: deleteFilm });
}

/** Refetches the film once the poster is stored (completeImageUpload in refetch.ts) */
export function useUploadPoster() {
  return useMutation({ mutationKey: ["completeImageUpload"], mutationFn: uploadPoster });
}

/** A master and a trailer refresh different things (the trailer is public), so one hook a kind */
export function useAttachVideo(kind: VideoKind) {
  return useMutation({
    mutationKey: [kind === "MASTER" ? "attachMasterVideo" : "attachTrailer"],
    mutationFn: attachVideo,
  });
}

export function useDeleteVideo() {
  return useMutation({ mutationKey: ["deleteVideo"], mutationFn: deleteVideo });
}
