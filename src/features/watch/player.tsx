// Client code without its own "use client": only the watch room (already a client component)
// imports it, so it never needs to be an entry point the server renders.

import MuxPlayer from "@mux/mux-player-react";
import { cn } from "cn";
import { Clock, Play, Radio } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, type ComponentRef } from "react";

import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useServerNow } from "@/hooks/use-now";
import { ErrorCode, serverOffset, toApiError } from "@/api";
import { isDemo } from "@/lib/demo";
import { formatClock, formatCountdown } from "@/lib/format";

import type { PlaybackAuthorization } from "./api-types";
import { heartbeat, refreshDrmToken, secureStop } from "./service";
import {
  CATCH_UP_RATE,
  SYNC_CHECK_MS,
  WATERMARK_OPACITY,
  syncZone,
  targetPosition,
  watermarkDrift,
  type SyncZone,
  type WatermarkSpot,
} from "./sync";

/*
 * The screening itself: Mux Player held on the first frame until the start, then playing the
 * room's moment, or, for Individual Watch, the member's own film from the beginning, theirs to
 * pause and rewind until the pass's cutoff. Loaded on the watch page only (next/dynamic), so no
 * other page carries it.
 */

export type PlaybackEnd = "another-device" | "closed";

type PlayerElement = ComponentRef<typeof MuxPlayer>;

const STAGE_ID = "watch-stage";

/** Where an Individual viewer got to, kept on this device so a reload picks up from there */
const positionKey = (ticketId: string) => `kc-watch-position:${ticketId}`;

function readPosition(ticketId: string): number {
  try {
    const saved = Number(sessionStorage.getItem(positionKey(ticketId)));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function savePosition(ticketId: string, seconds: number) {
  try {
    sessionStorage.setItem(positionKey(ticketId), String(Math.floor(seconds)));
  } catch {
    // Private windows may refuse storage; a reload then starts from the beginning
  }
}

/** The viewer's alias and reference, drifting across the picture from the session's seed */
function Watermark({ watermark }: { watermark: NonNullable<PlaybackAuthorization["watermark"]> }) {
  const [spot, setSpot] = useState<WatermarkSpot | null>(null);

  useEffect(() => {
    const next = watermarkDrift(watermark.seed);
    let timer: ReturnType<typeof setTimeout>;
    const move = () => {
      const position = next();
      setSpot(position);
      timer = setTimeout(move, position.holdMs);
    };
    move();
    return () => clearTimeout(timer);
  }, [watermark.seed]);

  if (!spot) return null;
  return (
    <span
      aria-hidden="true"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, opacity: WATERMARK_OPACITY[watermark.mode] }}
      className="pointer-events-none absolute z-10 font-mono text-sm font-semibold tracking-wider whitespace-nowrap text-white transition-[left,top] duration-3000 select-none sm:text-base"
    >
      {[watermark.alias, watermark.userRef].filter(Boolean).join(" · ")}
    </span>
  );
}

export default function Player({
  ticketId,
  title,
  ownPace,
  idle,
  authorization,
  onEnd,
  demoNudge,
}: {
  ticketId: string;
  title: string;
  /** Individual Watch: no room to keep up with, so pause and seek are the viewer's */
  ownPace: boolean;
  /** No pointer or key for a moment: what sits over the picture fades with the controls */
  idle: boolean;
  authorization: PlaybackAuthorization;
  onEnd: (reason: PlaybackEnd) => void;
  /** Demo only: "behind" drops the player back 30 s; "heartbeat" sends one at once */
  demoNudge?: { kind: "behind" | "heartbeat"; count: number };
}) {
  const ref = useRef<PlayerElement>(null);
  const [drmToken, setDrmToken] = useState(authorization.drmToken);
  const now = useServerNow();
  const [zone, setZone] = useState<SyncZone>("live");
  const [needsTap, setNeedsTap] = useState(false);
  const [shortOfTime, setShortOfTime] = useState(false);
  const { schedule, sessionId } = authorization;
  const startsAt = Date.parse(schedule.startTime);
  const started = now !== null && now >= startsAt;
  const endsAt = formatClock(schedule.hardCutoff);

  /** Where the room is now. The demo's film is a short teaser, so it loops to stay in range. */
  const roomPosition = () => {
    const position = targetPosition(schedule.startTime, Date.now() + serverOffset());
    const duration = ref.current?.duration;
    return isDemo && duration && Number.isFinite(duration) ? position % duration : position;
  };

  /** Plays from `from` (Individual Watch) or the room's moment; with neither, carries on */
  const play = (from?: number) => {
    const player = ref.current;
    if (!player) return;
    // The room's moment needs the film's length (the demo loops), known once metadata loads
    if (player.readyState < 1) {
      player.addEventListener("loadedmetadata", () => play(from), { once: true });
      return;
    }
    const position = ownPace ? from : roomPosition();
    if (position !== undefined) player.currentTime = position;
    player.play().then(
      () => setNeedsTap(false),
      // The browser wants a tap before sound plays
      () => setNeedsTap(true),
    );
  };

  // The start: the room begins together and a late arrival joins at the room's moment; an
  // Individual viewer starts from the beginning, or where this device left off
  const onStart = useEffectEvent(() => play(ownPace ? readPosition(ticketId) : undefined));
  useEffect(() => {
    if (started) onStart();
  }, [started]);

  // Stay with the room: catch up gently, snap back from ahead, offer a jump when far behind.
  // Individual Watch only keeps its place and watches the clock against the cutoff.
  const onSyncCheck = useEffectEvent(() => {
    const player = ref.current;
    if (!player) return;
    const timeLeft = Date.parse(schedule.hardCutoff) - (Date.now() + serverOffset());
    if (timeLeft <= 0) {
      onEnd("closed");
      return;
    }
    if (ownPace) {
      savePosition(ticketId, player.currentTime);
      const rest = player.duration - player.currentTime;
      setShortOfTime(!isDemo && Number.isFinite(rest) && rest * 1000 > timeLeft);
      return;
    }
    const target = roomPosition();
    let lag = target - player.currentTime;
    // Round the demo's loop, the gap is the shorter way: just past the end is just behind
    const duration = player.duration;
    if (isDemo && Number.isFinite(duration) && Math.abs(lag) > duration / 2) {
      lag -= Math.sign(lag) * duration;
    }
    const next = syncZone(lag);
    if (next === "ahead") player.currentTime = target;
    player.playbackRate = next === "catch-up" ? CATCH_UP_RATE : 1;
    setZone(next === "ahead" ? "live" : next);
  });
  useEffect(() => {
    if (!started) return;
    const check = setInterval(onSyncCheck, SYNC_CHECK_MS);
    return () => clearInterval(check);
  }, [started]);

  // The lease: renewed on the API's interval. A refusal stops playback; a network blip doesn't
  const onBeat = useEffectEvent(() => {
    heartbeat(ticketId, sessionId).catch((error) => {
      const apiError = toApiError(error);
      if (apiError.is(ErrorCode.STREAM_SESSION_INVALID)) onEnd("another-device");
      else if (apiError.is(ErrorCode.STREAM_CLOSED)) onEnd("closed");
    });
  });
  const beatEvery = authorization.heartbeatIntervalSeconds * 1000;
  useEffect(() => {
    const timer = setInterval(onBeat, beatEvery);
    return () => clearInterval(timer);
  }, [beatEvery]);

  // DRM licence tokens last 5 minutes: renew every 4, while this device holds the lease
  const onRenewDrm = useEffectEvent(() => {
    refreshDrmToken(ticketId, sessionId).then(
      (renewed) => setDrmToken(renewed.drmToken),
      (error) => {
        if (toApiError(error).is(ErrorCode.STREAM_SESSION_INVALID)) onEnd("another-device");
      },
    );
  });
  const drmProtected = authorization.drmProtected;
  useEffect(() => {
    if (!drmProtected) return;
    const timer = setInterval(onRenewDrm, 4 * 60_000);
    return () => clearInterval(timer);
  }, [drmProtected, sessionId]);

  // Secure Stop: give the lease back when the page closes or the viewer leaves the room
  useEffect(() => {
    const release = () => secureStop(ticketId, sessionId);
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [ticketId, sessionId]);

  const onNudge = useEffectEvent(() => {
    const player = ref.current;
    if (demoNudge?.kind === "behind" && player) {
      player.currentTime = Math.max(0, player.currentTime - 30);
    }
    if (demoNudge?.kind === "heartbeat") onBeat();
  });
  const nudges = demoNudge?.count ?? 0;
  useEffect(() => {
    if (nudges > 0) onNudge();
  }, [nudges]);

  return (
    <div id={STAGE_ID} className="relative aspect-video w-full overflow-hidden bg-black">
      <MuxPlayer
        ref={ref}
        playbackId={authorization.playbackId}
        tokens={
          authorization.playbackToken
            ? {
                playback: authorization.playbackToken,
                drm: drmToken ?? undefined,
              }
            : undefined
        }
        streamType="on-demand"
        preload="auto"
        loop={isDemo}
        fullscreenElement={STAGE_ID}
        accentColor="#d60211"
        metadataVideoTitle={title}
        // Seeking past the room is undone at once: everyone watches the same moment
        onSeeking={() => {
          const player = ref.current;
          if (!ownPace && started && player && player.currentTime > roomPosition() + 1.5) {
            player.currentTime = roomPosition();
          }
        }}
        // No controls in the lobby (nothing to press until the film starts for everyone), nor
        // behind the tap to start
        style={{
          width: "100%",
          height: "100%",
          // No speed control for now, in any room: the hall sets the rate itself (1×, or a
          // gentle catch-up) every sync check, so a viewer's choice can't hold there, and
          // Individual Watch keeps the same controls. Remove this line to bring it back.
          "--playback-rate-button": "none",
          ...((!started || needsTap) && { "--controls": "none" }),
        }}
        className={cn(
          // Settings menus (quality, speed) in the cinema's black rather than the theme's white.
          // The theme sets their colours on the menus themselves, so only its exported part reaches
          "[&::part(menu)]:border-white/10 [&::part(menu)]:bg-black/90 [&::part(menu)]:text-white",
          !started && "pointer-events-none",
        )}
      />

      {authorization.watermark && <Watermark watermark={authorization.watermark} />}

      {/* The cinema's mark, faint in the corner above the controls, in full screen too */}
      <LogoMark className="pointer-events-none absolute right-4 bottom-10 z-10 size-9 opacity-30 select-none sm:right-6 sm:size-12" />

      {!started && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/65 text-center">
          <div>
            <p className="text-[0.7rem] font-bold tracking-[0.3em] text-lobby uppercase">
              Lobby open · starts in
            </p>
            <p className="mt-3 font-display text-5xl font-black tabular-nums sm:text-7xl">
              {now === null ? "…" : formatCountdown(startsAt - now)}
            </p>
            <p className="mt-3 text-sm text-white/60">
              {ownPace
                ? `Your film starts here. Pause and rewind as you like until ${endsAt}.`
                : "The film starts for everyone at once. Stay on this page."}
            </p>
          </div>
        </div>
      )}

      {needsTap && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/60">
          <Button size="xl" onClick={() => play()}>
            <Play data-icon="inline-start" />
            Start watching
          </Button>
        </div>
      )}

      {/* Individual Watch's end of access, in full screen too: with the controls, or held on
          screen once the rest of the film runs past it (a warning, never a block) */}
      {ownPace && started && !needsTap && (
        <div
          role="status"
          className={cn(
            "absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm backdrop-blur-xl transition-opacity duration-500",
            idle && !shortOfTime && "opacity-0",
          )}
        >
          <Clock aria-hidden="true" className="size-4 text-lobby" />
          {shortOfTime
            ? `You may not finish before access ends at ${endsAt}.`
            : `Access ends at ${endsAt}`}
        </div>
      )}

      {!ownPace && started && zone === "behind" && !needsTap && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3 rounded-full border border-white/15 bg-black/80 py-1.5 pr-1.5 pl-4 text-sm backdrop-blur-xl">
          You&rsquo;re behind the room
          <Button size="sm" onClick={() => play()}>
            <Radio data-icon="inline-start" />
            Jump to live
          </Button>
        </div>
      )}
    </div>
  );
}
