// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { FileVideo, ImagePlus, TriangleAlert, Upload } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/features/auth/form-parts";

/*
 * Choosing a file never sends it: each dialog shows what was chosen, checks it, and sends only on
 * Upload. An image is previewed in its frame; a video shows what its header says (a film is too
 * large to be worth previewing).
 */

export interface PixelSize {
  width: number;
  height: number;
}

/** "1.4 MB", "820 KB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "1h 58m", "2m 05s" */
export function formatLength(seconds: number): string {
  const whole = Math.round(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(whole % 60).padStart(2, "0")}s`;
}

/** Why an image of `size` can't fill a frame needing `min`, or null when it can */
export function imageTooSmall(size: PixelSize, min: PixelSize): string | null {
  if (size.width >= min.width && size.height >= min.height) return null;
  return `This image is ${size.width} × ${size.height}. It needs to be at least ${min.width} × ${min.height}.`;
}

/** True when an image's shape is more than 6% off its frame's, so it will be cropped */
export function croppedInFrame(size: PixelSize, ratio: number): boolean {
  return Math.abs(size.width / size.height - ratio) / ratio > 0.06;
}

function readImageSize(file: File): Promise<PixelSize | null> {
  return createImageBitmap(file).then(
    (bitmap) => {
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    },
    () => null,
  );
}

interface VideoInfo extends Partial<PixelSize> {
  seconds?: number;
}

/** Length and resolution from the file's header, read in the browser; nothing is sent */
function readVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const done = (info: VideoInfo) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(info);
    };
    video.onloadedmetadata = () =>
      done({
        seconds: Number.isFinite(video.duration) ? video.duration : undefined,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    // A format the browser can't read (ProRes, say) still uploads; Mux reads it
    video.onerror = () => done({});
    video.src = url;
  });
}

/** Where a file is dropped or chosen */
function FileDrop({
  accept,
  onFile,
  disabled,
  className,
  children,
}: {
  accept: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      className={cn(
        "group relative grid w-full place-items-center overflow-hidden rounded-xl border border-dashed transition-colors",
        disabled ? "pointer-events-none" : "cursor-pointer",
        over ? "border-brand bg-brand/5" : "border-white/20 hover:border-white/40",
        className,
      )}
    >
      {children}
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

const dialogClass = "border border-white/10 bg-surface-1 sm:max-w-lg";

export interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** The frame's shape (width / height): the preview shows the crop */
  ratio: number;
  minSize: PixelSize;
  accept: string;
  /** The file's own problem (type, weight), before it is read */
  check: (file: File) => string | null;
  /** Sends the file, reporting progress from 0 to 100; the dialog closes once it resolves */
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  /** The refusal in words, shown in the dialog so the file can be changed */
  explainError: (error: unknown) => string;
}

/** An image chosen, previewed in its frame, checked, then sent on Upload */
export function ImageUploadDialog({ open, onOpenChange, ...props }: ImageUploadDialogProps) {
  const [sending, setSending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{props.title}</DialogTitle>
          <DialogDescription className="text-white/55">{props.description}</DialogDescription>
        </DialogHeader>
        {/* Inside the content, so each opening starts with no file */}
        <ImageUploadForm
          {...props}
          onSendingChange={setSending}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ImageUploadForm({
  ratio,
  minSize,
  accept,
  check,
  onUpload,
  explainError,
  onSendingChange,
  onDone,
}: Omit<ImageUploadDialogProps, "open" | "onOpenChange" | "title" | "description"> & {
  onSendingChange: (sending: boolean) => void;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState<PixelSize | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function choose(next: File) {
    setFile(null);
    setPreview(null);
    setSize(null);
    const invalid = check(next);
    if (invalid) {
      setProblem(invalid);
      return;
    }
    const read = await readImageSize(next);
    if (!read) {
      setProblem("That image couldn't be read. Try another file.");
      return;
    }
    setProblem(imageTooSmall(read, minSize));
    setFile(next);
    setSize(read);
    setPreview(URL.createObjectURL(next));
  }

  async function upload() {
    if (!file) return;
    setProblem(null);
    setProgress(0);
    onSendingChange(true);
    try {
      await onUpload(file, setProgress);
      onSendingChange(false);
      onDone();
    } catch (error) {
      setProblem(explainError(error));
      setProgress(null);
      onSendingChange(false);
    }
  }

  const sending = progress !== null;
  const ready = Boolean(file && size && !imageTooSmall(size, minSize));

  return (
    <>
      <FileDrop
        accept={accept}
        onFile={(next) => void choose(next)}
        disabled={sending}
        className={cn(ratio < 1 && "mx-auto max-w-60")}
      >
        <span className="block w-full" style={{ aspectRatio: ratio }}>
          {preview ? (
            // A local preview: the browser's own object URL, never optimised
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="The chosen image, as it will be framed"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-white/50">
              <ImagePlus aria-hidden="true" className="size-6 text-white/40" />
              Drop an image here, or choose one
            </span>
          )}
          {preview && !sending && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs font-medium opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              Choose another
            </span>
          )}
        </span>
      </FileDrop>

      {file && size && (
        <p className="text-xs text-white/55">
          {file.name} · {size.width} × {size.height} · {formatBytes(file.size)}
        </p>
      )}
      {size && !problem && croppedInFrame(size, ratio) && (
        <p className="flex items-start gap-2 text-xs text-gold">
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          This image is a different shape from its frame, so its edges are cropped as shown.
        </p>
      )}
      {progress !== null && <ProgressBar percent={progress} label="Uploading…" />}
      {problem && <FormAlert>{problem}</FormAlert>}

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={sending}>
          Cancel
        </Button>
        <Button onClick={() => void upload()} disabled={!ready || sending}>
          <Upload data-icon="inline-start" />
          {sending ? "Uploading…" : "Upload"}
        </Button>
      </DialogFooter>
    </>
  );
}

export interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** A line about what this upload changes (a master's length becomes the runtime) */
  note?: string;
  /** Starts the upload; the dialog closes and the page shows its progress */
  onStart: (file: File) => void;
}

/** A video chosen and described from its header, then started on Upload */
export function VideoUploadDialog({ open, onOpenChange, ...props }: VideoUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{props.title}</DialogTitle>
          <DialogDescription className="text-white/55">{props.description}</DialogDescription>
        </DialogHeader>
        <VideoUploadForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function VideoUploadForm({
  note,
  onStart,
  onDone,
}: Pick<VideoUploadDialogProps, "note" | "onStart"> & { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function choose(next: File) {
    setFile(null);
    setInfo(null);
    if (!next.type.startsWith("video/")) {
      setProblem("Choose a video file (MP4, MOV or similar).");
      return;
    }
    setProblem(null);
    setFile(next);
    setInfo(await readVideoInfo(next));
  }

  const details = info && [
    info.seconds !== undefined ? formatLength(info.seconds) : "Length unknown",
    info.width && info.height ? `${info.width} × ${info.height}` : null,
  ];

  return (
    <>
      <FileDrop accept="video/*" onFile={(next) => void choose(next)} className="min-h-36 p-5">
        {file ? (
          <span className="flex w-full items-center gap-4 text-left">
            <FileVideo aria-hidden="true" className="size-8 shrink-0 text-white/50" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{file.name}</span>
              <span className="mt-1 block text-xs text-white/55">
                {formatBytes(file.size)}
                {details ? details.filter(Boolean).map((part) => ` · ${part}`) : " · Reading…"}
              </span>
              <span className="mt-2 block text-xs text-white/40 group-hover:text-white/60">
                Choose another
              </span>
            </span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2 text-center text-xs text-white/50">
            <FileVideo aria-hidden="true" className="size-6 text-white/40" />
            Drop a video here, or choose one
          </span>
        )}
      </FileDrop>
      {note && <p className="text-xs text-white/55">{note}</p>}
      {problem && <FormAlert>{problem}</FormAlert>}

      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          disabled={!file || !info}
          onClick={() => {
            if (!file) return;
            onStart(file);
            onDone();
          }}
        >
          <Upload data-icon="inline-start" />
          Upload
        </Button>
      </DialogFooter>
    </>
  );
}
