"use client";

import { useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { ImagePlus, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { Panel } from "@/components/console/panel";
import { ErrorCode, toApiError } from "@/lib/api";

import type { AdminFilm, PosterKind } from "./api-types";
import { filmKeys } from "./queries";
import { posterProblem } from "./schemas";
import { uploadPoster } from "./service";

const SLOTS: { kind: PosterKind; label: string; ratio: number; hint: string }[] = [
  {
    kind: "POSTER_LANDSCAPE",
    label: "Landscape",
    ratio: 16 / 9,
    hint: "16:9, at least 1920 × 1080. The hero, the film page and the watch room.",
  },
  {
    kind: "POSTER_PORTRAIT",
    label: "Portrait",
    ratio: 2 / 3,
    hint: "2:3, at least 1000 × 1500. Film cards and phones.",
  },
];

/** The image's shape, to warn (never block) when it won't fill its frame */
function readRatio(file: File): Promise<number | null> {
  return createImageBitmap(file).then(
    (bitmap) => bitmap.width / bitmap.height,
    () => null,
  );
}

function PosterSlot({ film, slot }: { film: AdminFilm; slot: (typeof SLOTS)[number] }) {
  const id = useId();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const current = slot.kind === "POSTER_LANDSCAPE" ? film.posterLandscape : film.posterPortrait;
  const shown = preview ?? (current || null);

  async function send(file: File) {
    setProblem(null);
    setWarning(null);
    const invalid = posterProblem(file);
    if (invalid) {
      setProblem(invalid);
      return;
    }
    const ratio = await readRatio(file);
    if (ratio && Math.abs(ratio - slot.ratio) / slot.ratio > 0.06) {
      setWarning(
        `This image isn't ${slot.label.toLowerCase()} (${slot.hint.split(",")[0]}); it will be cropped.`,
      );
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setProgress(0);
    try {
      await uploadPoster(film.id, slot.kind, file, setProgress);
      await queryClient.invalidateQueries({ queryKey: filmKeys.all });
    } catch (error) {
      const apiError = toApiError(error);
      setPreview(null);
      setProblem(
        apiError.is(ErrorCode.IMAGE_TOO_LARGE)
          ? "That image is over 5 MB. Upload a smaller file."
          : apiError.is(ErrorCode.IMAGE_NOT_UPLOADED)
            ? "The image didn't arrive. Try the upload again."
            : apiError.is(ErrorCode.IMAGE_PROVIDER_UNAVAILABLE, ErrorCode.IMAGE_PROVIDER_ERROR)
              ? "The image host isn't answering. Try again in a few minutes."
              : "The upload didn't finish. Try again.",
      );
    } finally {
      setProgress(null);
      URL.revokeObjectURL(local);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{slot.label}</p>
        <p className="text-xs text-white/40">JPEG, PNG or WebP · 5 MB</p>
      </div>
      <label
        htmlFor={id}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) void send(file);
        }}
        style={{ aspectRatio: slot.ratio }}
        className={cn(
          "group relative mt-2 grid w-full cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed transition-colors",
          shown ? "border-white/10" : "border-white/20 hover:border-white/40",
          slot.kind === "POSTER_PORTRAIT" && "max-w-56",
        )}
      >
        {shown ? (
          <Image
            src={shown}
            alt={`${slot.label} poster`}
            fill
            sizes="400px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 p-4 text-center text-xs text-white/50">
            <ImagePlus aria-hidden="true" className="size-6 text-white/40" />
            Drop an image or choose one
          </span>
        )}
        {shown && progress === null && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs font-medium opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            Replace
          </span>
        )}
        {progress !== null && (
          <span className="absolute inset-x-3 bottom-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <span
              className="block h-full bg-brand transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={progress !== null}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void send(file);
          }}
        />
      </label>
      <p className="mt-2 text-xs text-white/45" aria-live="polite">
        {progress !== null ? `Uploading… ${progress}%` : slot.hint}
      </p>
      {warning && (
        <p className="mt-1.5 flex gap-1.5 text-xs text-gold">
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {warning}
        </p>
      )}
      {problem && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {problem}
        </p>
      )}
    </div>
  );
}

/** The film's two posters, each uploaded straight to the image host. */
export function PostersPanel({ film }: { film: AdminFilm }) {
  return (
    <Panel id="posters" title="Posters" description="Both are needed before the film goes on sale.">
      <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_14rem]">
        {SLOTS.map((slot) => (
          <PosterSlot key={slot.kind} film={film} slot={slot} />
        ))}
      </div>
    </Panel>
  );
}
