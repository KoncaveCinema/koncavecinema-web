import { api, type Paginated } from "@/api";
import { isDemo } from "@/lib/demo";

import type {
  AdminFilm,
  AdminFilmListItem,
  CertificateInput,
  DirectUpload,
  FilmInput,
  PosterKind,
  PosterUploadSignature,
  StoredPoster,
  VideoAsset,
  VideoKind,
} from "./api-types";
import * as demo from "./demo";

/*
 * The film catalogue's admin calls, one function per endpoint, plus the two uploads that go
 * straight from the browser to the media hosts (posters to the image host, videos to Mux).
 * With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the API's part and nothing leaves the tab.
 */

export interface FilmsQuery {
  status?: "draft" | "published";
  q?: string;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

export function listFilms(query: FilmsQuery): Promise<Paginated<AdminFilmListItem>> {
  if (isDemo) return demo.listFilms(query);
  return api.getPage<AdminFilmListItem>("/admin/movies", { params: query });
}

export function getFilm(id: string): Promise<AdminFilm> {
  if (isDemo) return demo.getFilm(id);
  return api.get<AdminFilm>(`/admin/movies/${id}`);
}

export function createFilm(input: FilmInput): Promise<{ id: string }> {
  if (isDemo) return demo.createFilm(input);
  return api.post<{ id: string }>("/admin/movies", input);
}

export async function updateFilm(id: string, input: FilmInput): Promise<void> {
  if (isDemo) return demo.updateFilm(id, input);
  await api.patch(`/admin/movies/${id}`, input);
}

export async function setCertificate(id: string, input: CertificateInput): Promise<void> {
  if (isDemo) return demo.setCertificate(id, input);
  await api.patch(`/admin/movies/${id}/compliance`, input);
}

export async function publishFilm(id: string): Promise<void> {
  if (isDemo) return demo.publishFilm(id);
  await api.patch(`/admin/movies/${id}/publish`);
}

export async function unpublishFilm(id: string): Promise<void> {
  if (isDemo) return demo.unpublishFilm(id);
  await api.patch(`/admin/movies/${id}/unpublish`);
}

export async function deleteFilm(id: string): Promise<void> {
  if (isDemo) return demo.deleteFilm(id);
  await api.delete(`/admin/movies/${id}`);
}

/* Posters: sign, send the file to the image host, then confirm */

/** Moves a progress bar along while a demo or simulated upload "sends" */
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

export async function uploadPoster(
  movieId: string,
  kind: PosterKind,
  file: File,
  onProgress: (percent: number) => void,
): Promise<StoredPoster> {
  const signature = isDemo
    ? await demo.signPosterUpload(movieId)
    : await api.post<PosterUploadSignature>("/admin/uploads/images", { movieId, kind });

  if (signature.simulated) {
    // No image host behind the signature: show the file locally, as the API's docs describe
    await simulateProgress(onProgress);
  } else {
    const form = new FormData();
    for (const [name, value] of Object.entries(signature.fields)) form.append(name, value);
    form.append("file", file);
    await sendForm(signature.uploadUrl, form, onProgress);
  }

  if (isDemo) return demo.completePosterUpload(movieId, kind, file);
  return api.post<StoredPoster>("/admin/uploads/images/complete", { movieId, kind });
}

/* Videos: open a direct upload, send the file to Mux in resumable chunks, follow processing */

export function createDirectUpload(movieId: string, kind: VideoKind): Promise<DirectUpload> {
  if (isDemo) return demo.createDirectUpload(movieId, kind);
  return api.post<DirectUpload>("/admin/videos/direct-upload", { movieId, kind });
}

/** A running upload that can be paused, resumed and abandoned */
export interface VideoUploadControl {
  pause: () => void;
  resume: () => void;
  abort: () => void;
  done: Promise<void>;
}

export async function sendVideo(
  upload: DirectUpload,
  file: File,
  onProgress: (percent: number) => void,
): Promise<VideoUploadControl> {
  if (isDemo || upload.simulated) {
    let paused = false;
    let aborted = false;
    const done = (async () => {
      for (let percent = 0; percent <= 100; percent += 4) {
        while (paused && !aborted) await new Promise((resolve) => setTimeout(resolve, 200));
        if (aborted) throw new Error("Upload cancelled");
        onProgress(percent);
        await new Promise((resolve) => setTimeout(resolve, 140));
      }
      if (isDemo) demo.finishVideoUpload(upload.videoAssetId, file.name);
    })();
    return {
      pause: () => (paused = true),
      resume: () => (paused = false),
      abort: () => {
        aborted = true;
        if (isDemo) demo.cancelVideoUpload(upload.videoAssetId);
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

export function getVideo(id: string): Promise<VideoAsset> {
  if (isDemo) return demo.getVideo(id);
  return api.get<VideoAsset>(`/admin/videos/${id}`);
}

export async function attachVideo(movieId: string, kind: VideoKind, videoId: string) {
  if (isDemo) {
    return kind === "MASTER"
      ? demo.attachMaster(movieId, videoId)
      : demo.attachTrailer(movieId, videoId);
  }
  await api.post(`/admin/movies/${movieId}/${kind === "MASTER" ? "video" : "trailer"}`, {
    videoAssetId: videoId,
  });
}

export async function deleteVideo(id: string): Promise<void> {
  if (isDemo) return demo.deleteVideo(id);
  await api.delete(`/admin/videos/${id}`);
}
