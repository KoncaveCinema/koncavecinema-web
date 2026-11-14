import { useQueryClient } from "@tanstack/react-query";
import { Film, Pause, Play, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { VideoUploadDialog } from "@/components/console/upload-dialogs";
import { Button } from "@/components/ui/button";
import { ErrorCode, toApiError } from "@/api";
import { isDemo } from "@/lib/demo";
import { formatLagosDateTime } from "@/lib/format";

import type { AdminFilm, AdminVideo, VideoKind } from "./api-types";
import { filmKeys, useAttachVideo, useDeleteVideo, useVideoProgress } from "./queries";
import { createDirectUpload, sendVideo, type VideoUploadControl } from "./service";

const KIND_LABEL: Record<VideoKind, string> = { MASTER: "Master", TRAILER: "Trailer" };

function duration(seconds: number | null) {
  if (!seconds) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 2) return `${Math.round(seconds)}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** One kind of video: what's attached, sending a new file, and attaching it once it's ready */
function VideoSlot({ film, kind }: { film: AdminFilm; kind: VideoKind }) {
  const noun = kind === "MASTER" ? "master" : "trailer";
  const [choosing, setChoosing] = useState(false);
  const queryClient = useQueryClient();
  const attach = useAttachVideo();
  const control = useRef<VideoUploadControl | null>(null);
  const [sending, setSending] = useState<{ percent: number; paused: boolean } | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const progress = useVideoProgress(sending ? null : videoId);

  const locked = kind === "MASTER" && film.isPublished;
  const attached = film.videos.find((video) => video.kind === kind && video.isAttached);
  // The newest ready upload not yet attached: the one to offer
  const ready =
    progress.data?.status === "READY"
      ? progress.data
      : film.videos.find(
          (video) => video.kind === kind && video.status === "READY" && !video.isAttached,
        );
  const processing =
    videoId && progress.data && progress.data.status !== "READY" ? progress.data : null;

  // Leaving mid-upload loses it: the browser asks first
  useEffect(() => {
    if (!sending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [sending]);

  // The film page's uploads list follows the processing upload's status
  useEffect(() => {
    if (progress.data?.status === "READY" || progress.data?.status === "ERRORED") {
      void queryClient.invalidateQueries({ queryKey: filmKeys.film(film.id) });
    }
  }, [progress.data?.status, queryClient, film.id]);

  async function send(file: File) {
    setProblem(null);
    if (!file.type.startsWith("video/")) {
      setProblem("Choose a video file (MP4, MOV or similar).");
      return;
    }
    try {
      const upload = await createDirectUpload(film.id, kind);
      setVideoId(upload.videoAssetId);
      setSending({ percent: 0, paused: false });
      control.current = await sendVideo(upload, file, (percent) =>
        setSending((current) => (current ? { ...current, percent } : current)),
      );
      await control.current.done;
      setSending(null);
      void queryClient.invalidateQueries({ queryKey: filmKeys.film(film.id) });
    } catch (error) {
      setSending(null);
      const apiError = toApiError(error);
      setProblem(
        apiError.is(ErrorCode.MOVIE_ALREADY_PUBLISHED)
          ? "A published film's master can't be replaced."
          : apiError.is(ErrorCode.BAD_GATEWAY, ErrorCode.SERVICE_UNAVAILABLE)
            ? "Mux isn't answering. Try again in a few minutes."
            : "The upload stopped. Choose the file again to start over.",
      );
    } finally {
      control.current = null;
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/8 bg-white/2 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{KIND_LABEL[kind]}</p>
        {attached ? (
          <StatusBadge kind="video" status="ATTACHED" />
        ) : (
          <StatusBadge kind="video" status="NONE" label="Not attached" />
        )}
      </div>
      <p className="mt-1 text-xs text-white/50">
        {kind === "MASTER"
          ? "The film itself. Signed playback only; its length becomes the runtime."
          : "Public. Plays on the film's page. Can be changed after publishing."}
      </p>
      {attached && (
        <p className="mt-3 text-sm text-white/70">
          {duration(attached.durationSeconds)} · {attached.maxResolution ?? "—"}
          {attached.isDrmProtected && " · DRM"}
        </p>
      )}

      <div className="mt-5 flex-1 space-y-3">
        {sending && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>{sending.paused ? "Paused" : "Uploading to Mux…"}</span>
              <span className="tabular-nums">{sending.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-brand transition-[width]"
                style={{ width: `${sending.percent}%` }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (sending.paused) control.current?.resume();
                  else control.current?.pause();
                  setSending({ ...sending, paused: !sending.paused });
                }}
              >
                {sending.paused ? (
                  <Play data-icon="inline-start" />
                ) : (
                  <Pause data-icon="inline-start" />
                )}
                {sending.paused ? "Resume" : "Pause"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => control.current?.abort()}>
                <X data-icon="inline-start" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!sending && processing && (
          <p className="flex items-center gap-2 text-sm text-white/70">
            <StatusBadge kind="video" status={processing.status} />
            {processing.status === "ERRORED"
              ? (processing.errorMessage ?? "Mux couldn't process this file.")
              : "Mux is encoding it. This page checks every few seconds."}
          </p>
        )}

        {!sending && ready && (
          <div className="rounded-lg border border-lobby/25 bg-lobby/6 p-3 text-sm">
            <p>
              A new {kind === "MASTER" ? "master" : "trailer"} is ready (
              {duration(ready.durationSeconds)}
              {ready.maxResolution && `, ${ready.maxResolution}`}).
            </p>
            <Button
              size="sm"
              className="mt-3"
              disabled={locked || attach.isPending}
              onClick={() =>
                attach.mutate(
                  { movieId: film.id, kind, videoId: ready.id },
                  {
                    onSuccess: () => {
                      setVideoId(null);
                      toast.success(`${KIND_LABEL[kind]} attached`);
                    },
                    onError: (error) =>
                      setProblem(
                        toApiError(error).is(ErrorCode.VIDEO_ASSET_WRONG_KIND)
                          ? "That upload is the wrong kind for this slot."
                          : "It couldn't be attached. Try again.",
                      ),
                  },
                )
              }
            >
              {attach.isPending
                ? "Attaching…"
                : `Attach as the ${kind === "MASTER" ? "master" : "trailer"}`}
            </Button>
            {locked && (
              <p className="mt-2 text-xs text-white/50">
                The film is published: its master is fixed, because sold screenings were timed by
                it.
              </p>
            )}
          </div>
        )}
      </div>

      {problem && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {problem}
        </p>
      )}

      <div className="mt-5">
        <Button
          variant="outline"
          size="sm"
          disabled={Boolean(sending) || locked}
          onClick={() => setChoosing(true)}
        >
          <Upload data-icon="inline-start" />
          {attached ? `Upload a new ${noun}` : `Upload the ${noun}`}
        </Button>
        {locked && !attached && (
          <p className="mt-2 text-xs text-white/50">
            Published films keep the master they launched with.
          </p>
        )}
      </div>

      <VideoUploadDialog
        open={choosing}
        onOpenChange={setChoosing}
        title={attached ? `Upload a new ${noun}` : `Upload the ${noun}`}
        description="It goes straight to Mux in resumable chunks. Keep this page open until it finishes."
        note={
          kind === "MASTER"
            ? "Its length becomes the film's runtime, which sets when each screening ends."
            : undefined
        }
        onStart={(file) => void send(file)}
      />
    </div>
  );
}

/** The film's videos: master and trailer side by side, then every upload made for it. */
export function MediaPanel({ film }: { film: AdminFilm }) {
  const remove = useDeleteVideo();
  const [deleting, setDeleting] = useState<AdminVideo | null>(null);

  return (
    <Panel
      id="media"
      flush
      title="Media"
      description={
        isDemo
          ? "Demo: uploads stay in this browser and finish in a few seconds. A file named with “fail” fails."
          : "Videos go straight to Mux in resumable chunks; keep this page open until they finish."
      }
    >
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <VideoSlot film={film} kind="MASTER" />
        <VideoSlot film={film} kind="TRAILER" />
      </div>
      <div className="border-t border-white/8">
        <p className="px-5 pt-4 pb-2 text-xs font-semibold tracking-wide text-white/55">Uploads</p>
        <DataTable
          rows={film.videos}
          rowKey={(video) => video.id}
          caption="Video uploads"
          empty={{
            icon: Film,
            title: "No uploads yet",
            hint: "Upload the master and trailer above.",
          }}
          columns={[
            { id: "kind", header: "Kind", cell: (video) => KIND_LABEL[video.kind] },
            {
              id: "status",
              header: "Status",
              cell: (video) => (
                <span className="flex flex-wrap gap-1.5">
                  <StatusBadge kind="video" status={video.status} />
                  {video.isAttached && <StatusBadge kind="video" status="ATTACHED" />}
                </span>
              ),
            },
            { id: "length", header: "Length", cell: (video) => duration(video.durationSeconds) },
            {
              id: "resolution",
              header: "Resolution",
              cell: (video) => video.maxResolution ?? "—",
              hideOnMobile: true,
            },
            {
              id: "created",
              header: "Uploaded",
              cell: (video) => (
                <span className="whitespace-nowrap text-white/60">
                  {formatLagosDateTime(video.createdAt)}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              id: "actions",
              header: "",
              align: "end",
              cell: (video) =>
                video.isAttached ? null : (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete this upload"
                    onClick={() => setDeleting(video)}
                  >
                    <Trash2 />
                  </Button>
                ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this upload?"
        description="It's removed at Mux as well. Attached videos can't be deleted."
        confirmLabel="Delete upload"
        pendingLabel="Deleting…"
        tone="danger"
        onConfirm={async () => {
          if (deleting) await remove.mutateAsync(deleting.id);
        }}
        explainError={(error) =>
          error.is(ErrorCode.VIDEO_ASSET_IN_USE)
            ? "This upload is attached to the film, so it can't be deleted."
            : undefined
        }
      />
    </Panel>
  );
}
