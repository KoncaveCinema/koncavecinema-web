"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useStaffSignedIn } from "../require-staff";
import { useRefreshAdmin } from "../use-refresh-admin";
import type { CertificateInput, FilmInput, VideoKind } from "./api-types";
import {
  attachVideo,
  createFilm,
  deleteFilm,
  deleteVideo,
  getFilm,
  getVideo,
  listFilms,
  publishFilm,
  setCertificate,
  unpublishFilm,
  updateFilm,
  type FilmsQuery,
} from "./service";

/*
 * The film catalogue's server data, keyed under "admin" so a write can refresh the console.
 */

export const filmKeys = {
  all: ["admin", "films"] as const,
  list: (query: FilmsQuery) => ["admin", "films", "list", query] as const,
  film: (id: string) => ["admin", "films", id] as const,
  video: (id: string) => ["admin", "videos", id] as const,
};

export function useFilms(query: FilmsQuery) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: filmKeys.list(query),
    queryFn: () => listFilms(query),
    enabled: staff,
    placeholderData: (previous) => previous,
  });
}

export function useFilm(id: string) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: filmKeys.film(id),
    queryFn: () => getFilm(id),
    enabled: staff && id !== "",
    retry: false,
  });
}

/** One upload's progress at Mux: polled every 5 s while it uploads or processes, then stops */
export function useVideoProgress(id: string | null) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: filmKeys.video(id ?? ""),
    queryFn: () => getVideo(id!),
    enabled: staff && id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "READY" || status === "ERRORED" || status === "CANCELLED" ? false : 5_000;
    },
  });
}

/* Writes: each refreshes the console's admin data (the film page, the lists, the overview) */

export function useCreateFilm() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: createFilm, onSuccess: refresh });
}

export function useUpdateFilm() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FilmInput }) => updateFilm(id, input),
    onSuccess: refresh,
  });
}

export function useSetCertificate() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CertificateInput }) =>
      setCertificate(id, input),
    onSuccess: refresh,
  });
}

export function usePublishFilm() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: publishFilm, onSuccess: refresh });
}

export function useUnpublishFilm() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: unpublishFilm, onSuccess: refresh });
}

export function useDeleteFilm() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: deleteFilm, onSuccess: refresh });
}

export function useAttachVideo() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({
      movieId,
      kind,
      videoId,
    }: {
      movieId: string;
      kind: VideoKind;
      videoId: string;
    }) => attachVideo(movieId, kind, videoId),
    onSuccess: refresh,
  });
}

export function useDeleteVideo() {
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: deleteVideo, onSuccess: refresh });
}
