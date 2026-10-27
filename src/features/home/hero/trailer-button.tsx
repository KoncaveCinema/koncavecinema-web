"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Plays a film's teaser in a dialog. hls.js is fetched only when the dialog opens, so no video
 * code ships with the page; iOS, which lacks Media Source Extensions, plays HLS natively.
 */
function StreamableEmbed({ src, title }: { src: string; title: string }) {
  const embedSrc = src.replace("streamable.com/", "streamable.com/e/");
  return (
    <iframe
      src={`${embedSrc}?autoplay=1`}
      title={`${title} teaser`}
      allow="autoplay; fullscreen"
      className="aspect-video w-full rounded-xl border-0 bg-black"
      allowFullScreen
    />
  );
}

function NativeTeaserVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    const play = () =>
      void video.play().catch(() => {
        // Autoplay with sound can be refused; the controls stay available
      });

    if (!src.includes(".m3u8")) {
      video.src = src;
      play();
    } else {
      // hls.js first wherever Media Source Extensions exist (desktop Chrome now also claims native
      // HLS, which handles fewer stream variants); native HLS only where hls.js cannot run (iOS)
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            play();
          }
          return;
        }
        const hls = new Hls({ capLevelToPlayerSize: true });
        hls.on(Hls.Events.MANIFEST_PARSED, play);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        destroy = () => hls.destroy();
      });
    }
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className="aspect-video w-full rounded-xl bg-black"
      aria-label={`${title} teaser`}
    />
  );
}

function TeaserVideo({ src, title }: { src: string; title: string }) {
  if (src.includes("streamable.com")) {
    return <StreamableEmbed src={src} title={title} />;
  }
  return <NativeTeaserVideo src={src} title={title} />;
}

export function TrailerButton({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="xl">
          <Play data-icon="inline-start" className="fill-current" />
          Watch teaser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(92vw,64rem)] gap-4 border-white/10 bg-black p-3 sm:max-w-[min(92vw,64rem)] sm:p-4">
        <DialogHeader className="px-1">
          <DialogTitle className="font-display font-extrabold">{title}</DialogTitle>
          <DialogDescription>Official teaser</DialogDescription>
        </DialogHeader>
        {open && <TeaserVideo src={src} title={title} />}
      </DialogContent>
    </Dialog>
  );
}
