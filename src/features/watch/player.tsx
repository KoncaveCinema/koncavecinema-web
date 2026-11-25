// Client code without its own "use client": only the watch room (already a client component)
// imports it, so it never needs to be an entry point the server renders.

import MuxPlayer from "@mux/mux-player-react";
import { cn } from "cn";
import { Clock, Play, Radio } from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";

import { ErrorCode, serverOffset, toApiError } from "@/api";
import {
  heartbeat,
  holdSession,
  refreshDrmToken,
  scheduleSecureStop,
  secureStop,
} from "@/api/stream-security/stream-security-api";
import type {
  PlaybackAuthorization,
  Watermark as WatermarkInfo,
} from "@/api/stream-security/stream-security-schemas";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useServerClock } from "@/hooks/use-now";
import { formatClock } from "@/lib/format";

import type { SuiteClock } from "@/api/rooms/rooms-schemas";

import { LobbyOverlay } from "./lobby-overlay";
import { suiteMoment } from "./suite-clock";
import {
  CATCH_UP_RATE,
  SYNC_CHECK_MS,
  WATERMARK_OPACITY,
  filmOver,
  syncZone,
  targetPosition,
  watermarkDrift,
  type SyncZone,
  type WatermarkSpot,
} from "./sync";

// No Chromecast or AirPlay: a cast screen plays the stream on its own, without the watermark
// this page draws over it. Mux reads the setting the moment a player is created (and would
// otherwise load Google's cast script), so it is set on the element itself, before any exists
const MuxVideo = globalThis.customElements?.get("mux-video");
if (MuxVideo) {
  Object.defineProperty(MuxVideo.prototype, "disableRemotePlayback", {
    get: () => true,
    set() {},
    configurable: true,
  });
}

/*
 * The screening itself: Mux Player held on the first frame until the start, then playing the
 * room's moment, or, for Individual Watch, the member's own film from the beginning, theirs to
 * pause and rewind until the pass's cutoff. Loaded on the watch page only (next/dynamic), so no
 * other page carries it.
 */

/**
 * "session-ended": the API ended this session (asked again at once); "another-device": another
 * device took the pass while this one was away; "closed": the screening is over
 */
export type PlaybackEnd = "session-ended" | "another-device" | "closed";

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
function Watermark({ watermark }: { watermark: WatermarkInfo }) {
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
  onPictureChange,
  overlay,
  suiteClock,
}: {
  ticketId: string;
  title: string;
  /** Individual Watch: no room to keep up with, so pause and seek are the viewer's */
  ownPace: boolean;
  /** No pointer or key for a moment: what sits over the picture fades with the controls */
  idle: boolean;
  authorization: PlaybackAuthorization;
  onEnd: (reason: PlaybackEnd) => void;
  /** Whether the film's picture is on screen; until it is, the page keeps the poster behind */
  onPictureChange: (showing: boolean) => void;
  /** Drawn over the picture inside the player's frame, so full screen keeps it (hall reactions) */
  overlay?: ReactNode;
  /**
   * A private suite's film follows its host: the API's clock, or null until it arrives (it starts
   * on the schedule, like a hall). Undefined everywhere else
   */
  suiteClock?: SuiteClock | null;
}) {
  const ref = useRef<PlayerElement>(null);
  const [drmToken, setDrmToken] = useState(authorization.drmToken);
  const [zone, setZone] = useState<SyncZone>("live");
  const [needsTap, setNeedsTap] = useState(false);
  const [shortOfTime, setShortOfTime] = useState(false);
  const { schedule, sessionId } = authorization;
  // The API has ended this session: there is no lease left to give back
  const sessionLost = useRef(false);
  const loseSession = (reason: PlaybackEnd) => {
    sessionLost.current = true;
    onEnd(reason);
  };
  /** The API's answer to a heartbeat or a DRM renewal that refuses this session */
  const refused = (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.is(ErrorCode.STREAM_SESSION_INVALID)) loseSession("session-ended");
    else if (apiError.is(ErrorCode.STREAM_IN_USE_ON_ANOTHER_DEVICE)) loseSession("another-device");
    else if (apiError.is(ErrorCode.STREAM_CLOSED)) onEnd("closed");
  };
  const startsAt = Date.parse(schedule.startTime);
  // Changes once, at the start; the countdown ticks on its own, so the player doesn't re-render
  const started = useServerClock((now) => now !== null && now >= startsAt);
  const endsAt = formatClock(schedule.hardCutoff);
  // The picture shows once the film has started and is playing (no tap still wanted)
  const showing = started && !needsTap;
  const onShowing = useEffectEvent(onPictureChange);
  useEffect(() => {
    onShowing(showing);
    return () => onShowing(false);
  }, [showing]);

  const suite = suiteClock !== undefined;
  /** The suite's film now, by the host's clock */
  const suiteNow = () => (suiteClock ? suiteMoment(suiteClock, Date.now() + serverOffset()) : null);
  /** Where the room is now: the host's clock in a suite, the schedule in a hall */
  const roomPosition = () =>
    suiteNow()?.position ?? targetPosition(schedule.startTime, Date.now() + serverOffset());

  /** Plays from `from` (Individual Watch) or the room's moment; with neither, carries on */
  const play = (from?: number) => {
    const player = ref.current;
    if (!player) return;
    // A position set before the metadata loads is lost: wait for it
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
    // A suite's end of access moves later with each pause: the API's heartbeat says when it's over
    if (timeLeft <= 0 && !suite) {
      onEnd("closed");
      return;
    }
    if (ownPace) {
      savePosition(ticketId, player.currentTime);
      const rest = player.duration - player.currentTime;
      setShortOfTime(Number.isFinite(rest) && rest * 1000 > timeLeft);
      return;
    }
    // The host has the film paused: hold it on their frame
    const moment = suiteNow();
    if (moment?.paused) {
      if (!player.paused) player.pause();
      if (Math.abs(player.currentTime - moment.position) > 0.5)
        player.currentTime = moment.position;
      setZone("live");
      return;
    }
    if (suite && player.paused && !needsTap && !player.ended) {
      play();
      return;
    }
    const target = roomPosition();
    // The room has passed the end of the video: the screening is over, whatever the cutoff
    if (filmOver(target, player.duration)) {
      onEnd("closed");
      return;
    }
    const next = syncZone(target - player.currentTime);
    if (next === "ahead") player.currentTime = target;
    player.playbackRate = next === "catch-up" ? CATCH_UP_RATE : 1;
    setZone(next === "ahead" ? "live" : next);
  });
  useEffect(() => {
    if (!started) return;
    const check = setInterval(onSyncCheck, SYNC_CHECK_MS);
    return () => clearInterval(check);
  }, [started]);
  // The host paused, resumed or moved the film: follow at once, not at the next check
  useEffect(() => {
    if (started && suiteClock) onSyncCheck();
  }, [started, suiteClock]);

  // The lease: renewed on the API's interval. An ended session is asked for again; a pass taken
  // by another device or a closed screening stops playback; a network blip changes nothing
  const onBeat = useEffectEvent(() => {
    heartbeat(ticketId, sessionId).catch(refused);
  });
  const beatEvery = authorization.heartbeatIntervalSeconds * 1000;
  useEffect(() => {
    const timer = setInterval(onBeat, beatEvery);
    return () => clearInterval(timer);
  }, [beatEvery]);

  // DRM licence tokens last 5 minutes: renew every 4, while this device holds the lease
  const onRenewDrm = useEffectEvent(() => {
    refreshDrmToken(ticketId, sessionId).then((renewed) => setDrmToken(renewed.drmToken), refused);
  });
  const drmProtected = authorization.drmProtected;
  useEffect(() => {
    if (!drmProtected) return;
    const timer = setInterval(onRenewDrm, 4 * 60_000);
    return () => clearInterval(timer);
  }, [drmProtected, sessionId]);

  // Full screen takes the whole stage, so the watermark and the mark go with the picture. Mux
  // applies `fullscreenElement` only if its controls exist when the attribute is set, which this
  // lazily loaded player misses: set it on the controls once they do
  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    const attach = () => {
      const stage = document.getElementById(STAGE_ID);
      if (player.mediaController && stage) player.mediaController.fullscreenElement = stage;
      // No picture-in-picture either: its window shows the film without the watermark
      player.media?.setAttribute("disablepictureinpicture", "");
    };
    attach();
    player.addEventListener("loadedmetadata", attach);
    return () => player.removeEventListener("loadedmetadata", attach);
  }, []);

  // Secure Stop: give the lease back when the page closes or the viewer leaves the room, never
  // when React only re-mounts the player, and never for a session the API has already ended
  useEffect(() => {
    holdSession(sessionId);
    const release = () => {
      if (!sessionLost.current) secureStop(ticketId, sessionId);
    };
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      if (!sessionLost.current) scheduleSecureStop(ticketId, sessionId);
    };
  }, [ticketId, sessionId]);

  return (
    // Until the picture shows (the lobby, or a tap wanted for sound) the stage is clear and the
    // player hidden but loading, so the room sits on the same poster as its other screens
    <div
      id={STAGE_ID}
      className={cn("relative aspect-video w-full overflow-hidden", showing && "bg-black")}
    >
      <MuxPlayer
        ref={ref}
        playbackId={authorization.playbackId}
        tokens={{ playback: authorization.playbackToken, drm: drmToken ?? undefined }}
        streamType="on-demand"
        preload="auto"
        // The end of the video ends the screening; an Individual viewer starts over next time
        onEnded={() => {
          if (ownPace) savePosition(ticketId, 0);
          onEnd("closed");
        }}
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
        // A room plays like a cinema: a pause from outside the controls (a media key, the
        // system's player) resumes at once, at the room's moment
        onPause={() => {
          const player = ref.current;
          if (!ownPace && started && !needsTap && player && !player.ended && !suiteNow()?.paused) {
            play();
          }
        }}
        // Keys can't pause or seek a room; Individual Watch keeps them
        nohotkeys={!ownPace}
        // No controls in the lobby (nothing to press until the film starts for everyone), nor
        // behind the tap to start
        style={{
          width: "100%",
          height: "100%",
          // No speed control for now, in any room: the hall sets the rate itself (1×, or a
          // gentle catch-up) every sync check, so a viewer's choice can't hold there, and
          // Individual Watch keeps the same controls. Remove this line to bring it back.
          "--playback-rate-button": "none",
          "--pip-button": "none",
          // A room: no pause, no seeking, and a tap on the picture does nothing. Volume,
          // captions, quality and full screen stay
          ...(!ownPace && {
            "--play-button": "none",
            "--seek-backward-button": "none",
            "--seek-forward-button": "none",
            "--time-range": "none",
            "--media-gesture-receiver-display": "none",
          }),
          ...((!started || needsTap) && { "--controls": "none" }),
        }}
        className={cn(
          // Settings menus (quality, speed) in the cinema's black rather than the theme's white.
          // The theme sets their colours on the menus themselves, so only its exported part reaches
          "[&::part(menu)]:border-white/10 [&::part(menu)]:bg-black/90 [&::part(menu)]:text-white",
          !started && "pointer-events-none",
          !showing && "invisible",
        )}
      />

      {/* Over the picture only: in the lobby there is nothing to mark, and it would sit on the
          countdown */}
      {authorization.watermark && showing && <Watermark watermark={authorization.watermark} />}

      {overlay}

      {/* The cinema's mark, faint in the corner above the controls, in full screen too */}
      <LogoMark className="pointer-events-none absolute right-4 bottom-10 z-10 size-9 opacity-30 select-none sm:right-6 sm:size-12" />

      {!started && <LobbyOverlay startsAt={startsAt} ownPace={ownPace} endsAt={endsAt} />}

      {needsTap && (
        <div className="absolute inset-0 z-20 grid place-items-center">
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
