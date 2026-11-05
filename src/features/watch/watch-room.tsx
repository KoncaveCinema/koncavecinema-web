"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import {
  ArrowLeft,
  Clapperboard,
  CreditCard,
  FlaskConical,
  Loader,
  MonitorSmartphone,
  RotateCw,
  SearchX,
  TicketX,
  Wrench,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";

import { LiveDot } from "@/components/cinema/live-dot";
import { Button } from "@/components/ui/button";
import { useTicket } from "@/features/dashboard/queries";
import { roomName } from "@/features/dashboard/ticket-card";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { useServerNow } from "@/hooks/use-now";
import { ErrorCode, toApiError } from "@/lib/api";
import { isDemo } from "@/lib/demo";
import { screeningPhase, watchableUntil } from "@/lib/screening-window";

import { DEMO_REFUSALS, setDemoRefusal, type DemoRefusal } from "./demo";
import type { PlaybackEnd } from "./player";
import { LobbyCountdown, LocationCheck, RoomMessage } from "./screens";
import { authorizePlayback } from "./service";

// Mux Player loads on this page only, and only in the browser
const Player = dynamic(() => import("./player"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse bg-white/3" />,
});

/** Hides the top bar while the film plays and nobody touches anything */
function useIdle(active: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!active) return;
    let timer = setTimeout(() => setIdle(true), 3000);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [active]);
  return active && idle;
}

/**
 * /watch/[ticketId]: the screening room. Counts down to the lobby, asks the API for playback
 * once the doors open, then plays the room's moment. Every refusal has its own screen with the
 * way on; the pass and the API's checks decide, never the page.
 */
export function WatchRoom({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const ticket = useTicket(ticketId);
  const now = useServerNow();
  const [attempt, setAttempt] = useState(0);
  const [ended, setEnded] = useState<PlaybackEnd | null>(null);
  const [nudge, setNudge] = useState<{ kind: "behind" | "heartbeat"; count: number }>();

  const pass = ticket.data;
  const phase = pass && now !== null ? screeningPhase(pass, now) : null;
  const over = pass && now !== null && now >= watchableUntil(pass);
  const paid = pass?.status === "CONFIRMED" || pass?.status === "CHECKED_IN";
  const doorsOpen = paid && !over && (phase === "lobby" || phase === "live" || phase === "ended");

  // Playback is asked for once the doors open, and again only when the viewer retries
  const playback = useQuery({
    queryKey: ["playback", ticketId, attempt],
    queryFn: () => authorizePlayback(ticketId),
    enabled: doorsOpen,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Our clock and the API's can disagree by a moment at the door: ask again shortly
    retry: (count, error) => toApiError(error).is(ErrorCode.STREAM_NOT_OPEN) && count < 8,
    retryDelay: 15_000,
  });
  const authorization = ended ? undefined : playback.data;
  const playing = authorization !== undefined;
  const idle = useIdle(playing);

  const retry = () => {
    setEnded(null);
    setAttempt((count) => count + 1);
  };
  const passHref = `/dashboard/tickets/${ticketId}`;
  const backToPass = (
    <Button asChild size="lg" variant="outline">
      <Link href={passHref}>Back to your pass</Link>
    </Button>
  );

  function stage(): ReactNode {
    if (ticket.isPending) return <RoomMessage icon={Loader} title="Opening the room…" />;
    if (ticket.isError || !pass) {
      const missing = toApiError(ticket.error).is(ErrorCode.NOT_FOUND, ErrorCode.FORBIDDEN);
      return missing ? (
        <RoomMessage
          icon={SearchX}
          title="We can't find that pass"
          actions={
            <Button asChild size="lg">
              <Link href="/dashboard/tickets">See my tickets</Link>
            </Button>
          }
        >
          <p>It may belong to another account, or the link is incomplete.</p>
        </RoomMessage>
      ) : (
        <RoomMessage
          icon={RotateCw}
          title="The room couldn't open"
          actions={<Button onClick={() => void ticket.refetch()}>Try again</Button>}
        >
          <p>Check your connection, then try again.</p>
        </RoomMessage>
      );
    }

    if (pass.status === "CANCELLED") {
      return (
        <RoomMessage icon={TicketX} title="This pass was cancelled" actions={backToPass}>
          <p>Your pass shows the reason and where your refund is.</p>
        </RoomMessage>
      );
    }

    const endedScreen = (
      <RoomMessage
        icon={Clapperboard}
        title="This screening has ended"
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/movies">See what&rsquo;s showing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard/tickets">My tickets</Link>
            </Button>
          </>
        }
      >
        <p>Thanks for watching on Koncave.</p>
      </RoomMessage>
    );

    const anotherDevice = (title: string) => (
      <RoomMessage
        icon={MonitorSmartphone}
        tone="attention"
        title={title}
        actions={
          <>
            <Button size="lg" onClick={retry}>
              Watch here instead
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/help">Get help</Link>
            </Button>
          </>
        }
      >
        <p>One pass plays on one screen at a time. Stop it on the other device, then watch here.</p>
      </RoomMessage>
    );

    const unpaid = (
      <RoomMessage
        icon={CreditCard}
        tone="attention"
        title="This pass isn't paid yet"
        actions={
          <Button asChild size="lg">
            <Link
              href={
                pass.status === "RESERVED"
                  ? `/checkout/${pass.id}`
                  : `/movies/${pass.movieSlug}/showtimes/${pass.showtimeId}`
              }
            >
              {pass.status === "RESERVED" ? "Continue booking" : "Book again"}
            </Link>
          </Button>
        }
      >
        <p>Finish paying for your seat and the room opens for you.</p>
      </RoomMessage>
    );

    if (!paid) return unpaid;
    if (over) return endedScreen;
    if (phase === "upcoming") {
      return (
        <LobbyCountdown
          startTime={pass.startTime}
          lobbyOpensAt={pass.lobbyOpensAt}
          actions={backToPass}
        />
      );
    }

    if (authorization) {
      return (
        <Player
          ticketId={ticketId}
          title={pass.movieTitle}
          authorization={authorization}
          onEnd={setEnded}
          demoNudge={nudge}
        />
      );
    }
    if (ended === "closed") return endedScreen;
    if (ended) return anotherDevice("This pass is playing on another device");
    if (!playback.error || toApiError(playback.error).is(ErrorCode.STREAM_NOT_OPEN)) {
      return <RoomMessage icon={Loader} tone="lobby" title="Opening the doors…" />;
    }

    const refusalCode = toApiError(playback.error).code;
    switch (refusalCode) {
      case ErrorCode.STREAM_IN_USE_ON_ANOTHER_DEVICE:
        return anotherDevice("Playing on another device");
      case ErrorCode.LOCATION_VERIFICATION_REQUIRED:
        return <LocationCheck onConfirmed={retry} />;
      case ErrorCode.STREAM_CLOSED:
        return endedScreen;
      case ErrorCode.PASS_NOT_CONFIRMED:
        return unpaid;
      case ErrorCode.STREAM_NOT_READY:
        return (
          <RoomMessage
            icon={Wrench}
            tone="attention"
            title="The film isn't ready yet. We're on it"
            actions={<Button onClick={retry}>Try again</Button>}
          >
            <p>
              Give us a moment. If it doesn&rsquo;t open soon, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-4">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your pass number, {pass.seatIdentifier}.
            </p>
          </RoomMessage>
        );
      default:
        return (
          <RoomMessage
            icon={RotateCw}
            title="The screening couldn't start"
            actions={<Button onClick={retry}>Try again</Button>}
          >
            <p>Check your connection, then try again.</p>
          </RoomMessage>
        );
    }
  }

  const status =
    pass && phase === "live" && !over
      ? { label: "Live", tone: "live" as const }
      : pass && phase === "lobby"
        ? { label: "Lobby open", tone: "lobby" as const }
        : null;

  return (
    <div className="relative isolate flex min-h-svh flex-col bg-black">
      {pass && !playing && (
        <Image
          src={pass.posterLandscape}
          alt=""
          fill
          sizes="100vw"
          className="-z-10 scale-110 object-cover opacity-25 blur-2xl"
        />
      )}

      <header
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center gap-4 bg-linear-to-b from-black/90 to-transparent px-4 transition-opacity duration-500 sm:px-6",
          idle && "pointer-events-none opacity-0",
        )}
      >
        <Link
          href={passHref}
          aria-label="Back to your pass"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{pass?.movieTitle ?? " "}</p>
          {pass && <p className="truncate text-xs text-white/50">{roomName(pass.tier)}</p>}
        </div>
        {status && (
          <span className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-black/60 px-3 py-1 text-xs font-semibold">
            <LiveDot tone={status.tone} />
            {status.label}
          </span>
        )}
      </header>

      <main id="main" className="flex flex-1 flex-col justify-center">
        {/* Playing, the 16:9 stage fits the screen under the header and above the credit line,
            so nothing scrolls; full screen is the player's own button */}
        <div
          className={cn(
            "mx-auto w-full",
            playing ? "max-w-[min(100%,calc((100svh-7rem)*16/9))]" : "max-w-5xl",
          )}
        >
          {stage()}
        </div>
      </main>

      <footer className="flex flex-col items-center gap-4 px-4 py-6 text-center text-xs text-white/40">
        {isDemo && pass && (
          <DemoSwitcher
            playing={playing}
            onRefuse={(code) => {
              setDemoRefusal(code);
              if (code === ErrorCode.STREAM_SESSION_INVALID && playing) {
                setNudge((current) => ({ kind: "heartbeat", count: (current?.count ?? 0) + 1 }));
              } else retry();
            }}
            onBehind={() =>
              setNudge((current) => ({ kind: "behind", count: (current?.count ?? 0) + 1 }))
            }
          />
        )}
        <p>
          <a href="https://db-ip.com" className="underline-offset-4 hover:underline">
            IP Geolocation by DB-IP
          </a>
        </p>
      </footer>
    </div>
  );
}

/** Demo only: reach every screen of the room without waiting for it to happen */
function DemoSwitcher({
  playing,
  onRefuse,
  onBehind,
}: {
  playing: boolean;
  onRefuse: (code: DemoRefusal) => void;
  onBehind: () => void;
}) {
  return (
    <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-sky-400/30 bg-sky-400/5 px-3.5 py-2.5 text-sky-200/80">
      <FlaskConical aria-hidden="true" className="size-3.5 text-sky-400" />
      Demo:
      {(Object.keys(DEMO_REFUSALS) as DemoRefusal[])
        // A takeover ends a session that is playing
        .filter((code) => playing || code !== ErrorCode.STREAM_SESSION_INVALID)
        .map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onRefuse(code)}
            className="rounded-full border border-sky-400/25 px-2.5 py-1 transition-colors hover:bg-sky-400/10"
          >
            {DEMO_REFUSALS[code].label}
          </button>
        ))}
      {playing && (
        <button
          type="button"
          onClick={onBehind}
          className="rounded-full border border-sky-400/25 px-2.5 py-1 transition-colors hover:bg-sky-400/10"
        >
          Fall behind
        </button>
      )}
    </div>
  );
}
