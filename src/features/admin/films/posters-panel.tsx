"use client";

import { useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorCode, toApiError } from "@/api";
import { Panel } from "@/components/console/panel";
import { ImageUploadDialog, type PixelSize } from "@/components/console/upload-dialogs";

import type { AdminFilm, PosterKind } from "./api-types";
import { filmKeys } from "./queries";
import { POSTER_RULES, posterProblem } from "./schemas";
import { uploadPoster } from "./service";

const SLOTS: {
  kind: PosterKind;
  label: string;
  ratio: number;
  minSize: PixelSize;
  hint: string;
}[] = [
  {
    kind: "POSTER_LANDSCAPE",
    label: "Landscape",
    ratio: 16 / 9,
    minSize: { width: 1920, height: 1080 },
    hint: "16:9, at least 1920 × 1080. The hero, the film page and the watch room.",
  },
  {
    kind: "POSTER_PORTRAIT",
    label: "Portrait",
    ratio: 2 / 3,
    minSize: { width: 1000, height: 1500 },
    hint: "2:3, at least 1000 × 1500. Film cards and phones.",
  },
];

function uploadRefusal(error: unknown): string {
  const apiError = toApiError(error);
  return apiError.is(ErrorCode.IMAGE_TOO_LARGE)
    ? "That image is over 5 MB. Choose a smaller file."
    : apiError.is(ErrorCode.IMAGE_NOT_UPLOADED)
      ? "The image didn't arrive. Try the upload again."
      : apiError.is(ErrorCode.IMAGE_PROVIDER_UNAVAILABLE, ErrorCode.IMAGE_PROVIDER_ERROR)
        ? "The image host isn't answering. Try again in a few minutes."
        : "The upload didn't finish. Try again.";
}

function PosterSlot({ film, slot }: { film: AdminFilm; slot: (typeof SLOTS)[number] }) {
  const queryClient = useQueryClient();
  const [choosing, setChoosing] = useState(false);
  const current = slot.kind === "POSTER_LANDSCAPE" ? film.posterLandscape : film.posterPortrait;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{slot.label}</p>
        <p className="text-xs text-white/40">JPEG, PNG or WebP · 5 MB</p>
      </div>
      <button
        type="button"
        onClick={() => setChoosing(true)}
        aria-label={current ? `Replace the ${slot.label.toLowerCase()} poster` : undefined}
        style={{ aspectRatio: slot.ratio }}
        className={cn(
          "group relative mt-2 grid w-full place-items-center overflow-hidden rounded-xl border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          current ? "border-white/10" : "border-dashed border-white/20 hover:border-white/40",
          slot.kind === "POSTER_PORTRAIT" && "max-w-56",
        )}
      >
        {current ? (
          <>
            <Image
              src={current}
              alt={`${slot.label} poster`}
              fill
              sizes="400px"
              unoptimized
              className="object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Replace
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 p-4 text-center text-xs text-white/50">
            <ImagePlus aria-hidden="true" className="size-6 text-white/40" />
            Upload the {slot.label.toLowerCase()} poster
          </span>
        )}
      </button>
      <p className="mt-2 text-xs text-white/45">{slot.hint}</p>

      <ImageUploadDialog
        open={choosing}
        onOpenChange={setChoosing}
        title={`${current ? "Replace" : "Upload"} the ${slot.label.toLowerCase()} poster`}
        description={slot.hint}
        ratio={slot.ratio}
        minSize={slot.minSize}
        accept={POSTER_RULES.types.join(",")}
        check={(file) => posterProblem(file)}
        onUpload={async (file, onProgress) => {
          await uploadPoster(film.id, slot.kind, file, onProgress);
          await queryClient.invalidateQueries({ queryKey: filmKeys.all });
          toast.success(`${slot.label} poster updated`);
        }}
        explainError={uploadRefusal}
      />
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
