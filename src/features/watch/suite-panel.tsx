// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import {
  Crown,
  Loader,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  UserMinus,
  Volume2,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import type { SuiteMember } from "@/api/rooms/rooms-schemas";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useServerNow } from "@/hooks/use-now";
import { formatCountdown } from "@/lib/format";

import { useHostAlias, useMemberColors } from "./member-color";
import { useRoom } from "./room-store";
import { SEEK_STEP_SECONDS, suiteMoment } from "./suite-clock";
import { retryVoice, startSuiteAudio, toggleMic, useVoice } from "./suite-voice";

/** The suite's pause allowance, ticking down while the host has the film paused */
function PauseLeft({ prefix }: { prefix: string }) {
  const clock = useRoom((state) => state.suite?.clock);
  const now = useServerNow();
  if (!clock || now === null) return null;
  const { pauseLeft } = suiteMoment(clock, now);
  return (
    <>
      {prefix}
      <span className="font-semibold tabular-nums">{formatCountdown(pauseLeft * 1000)}</span>
    </>
  );
}

/** Over the film while the host has it paused, in full screen too */
export function SuitePausedOverlay() {
  const clock = useRoom((state) => state.suite?.clock);
  const now = useServerNow();
  if (!clock || now === null || !suiteMoment(clock, now).paused) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/40">
      <div className="rounded-2xl border border-white/15 bg-black/80 px-6 py-4 text-center backdrop-blur-xl">
        <p className="flex items-center justify-center gap-2 font-semibold">
          <Pause aria-hidden="true" className="size-4" />
          Paused by the host
        </p>
        <p className="mt-1 text-sm text-white/60">
          <PauseLeft prefix="Plays again by itself in " />
        </p>
      </div>
    </div>
  );
}

/** The microphone, and where the suite's voice stands */
function VoiceControls() {
  const { status, micOn, micLocked, micBlocked, needsTap } = useVoice();

  // Every state of the line is a button high, so the list under it never jumps
  if (status === "connecting" || status === "idle") {
    return (
      <p className="flex h-8 items-center gap-2 text-sm text-white/55">
        <Loader aria-hidden="true" className="size-4 animate-spin" />
        Joining voice…
      </p>
    );
  }
  if (status === "unavailable") {
    return (
      <p className="flex h-8 items-center text-sm text-white/55">
        Voice isn&apos;t available for this screening.
      </p>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex h-8 items-center justify-between gap-3 text-sm text-white/60">
        Voice couldn&apos;t connect.
        <Button size="sm" variant="outline" onClick={retryVoice}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={micOn ? "default" : "outline"}
          disabled={micLocked}
          aria-pressed={micOn}
          onClick={() => void toggleMic()}
        >
          {micOn ? <Mic data-icon="inline-start" /> : <MicOff data-icon="inline-start" />}
          {micLocked ? "The host muted you" : micOn ? "Mute mic" : "Turn on mic"}
        </Button>
        {needsTap && (
          <Button size="sm" variant="ghost" onClick={startSuiteAudio}>
            <Volume2 data-icon="inline-start" />
            Hear the suite
          </Button>
        )}
      </div>
      {micBlocked && (
        <p className="text-xs text-[#ff5a63]">
          Your browser blocked the microphone. Allow it from the address bar, then try again.
        </p>
      )}
    </div>
  );
}

/** One person in the suite, with a ring while they talk */
function MemberRow({
  name,
  color,
  speaking,
  muted,
  host,
  actions,
}: {
  name: string;
  /** Their colour, the same as their name in the chat */
  color: string | undefined;
  speaking: boolean;
  muted: boolean;
  host?: boolean;
  actions?: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-bold uppercase transition-shadow"
          style={{
            color,
            boxShadow: speaking ? `0 0 0 2px ${color ?? "currentColor"}` : undefined,
          }}
        >
          {name.charAt(0)}
        </span>
        <span className="truncate text-sm">
          {name}
          {speaking && <span className="sr-only"> (talking)</span>}
        </span>
        {host && <Crown aria-label="Host" className="size-3.5 shrink-0 text-gold" />}
        {muted && (
          <MicOff aria-label="Muted by the host" className="size-3.5 shrink-0 text-white/45" />
        )}
      </span>
      {actions && <span className="flex shrink-0 gap-1">{actions}</span>}
    </li>
  );
}

/** An icon-only host control, named on hover and focus as well as to screen readers */
function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={label} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The host's pause, resume and (while paused) moving the film for everyone */
function PlaybackControls() {
  const clock = useRoom((state) => state.suite?.clock);
  const connection = useRoom((state) => state.connection);
  const now = useServerNow();
  if (!clock || now === null) return null;
  const moment = suiteMoment(clock, now);
  const noPauseLeft = !moment.paused && moment.pauseLeft <= 0;
  const seek = (by: number) =>
    connection?.playback({ action: "seek", position: Math.max(0, moment.position + by) });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {moment.paused ? (
          <Button size="sm" onClick={() => connection?.playback({ action: "resume" })}>
            <Play data-icon="inline-start" />
            Resume for everyone
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={noPauseLeft}
            onClick={() => connection?.playback({ action: "pause" })}
          >
            <Pause data-icon="inline-start" />
            Pause for everyone
          </Button>
        )}
        {moment.paused && (
          <>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Back ${SEEK_STEP_SECONDS} seconds`}
              onClick={() => seek(-SEEK_STEP_SECONDS)}
            >
              <RotateCcw data-icon="inline-start" />
              {SEEK_STEP_SECONDS} s
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Forward ${SEEK_STEP_SECONDS} seconds`}
              onClick={() => seek(SEEK_STEP_SECONDS)}
            >
              <RotateCw data-icon="inline-start" />
              {SEEK_STEP_SECONDS} s
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-white/50">
        {noPauseLeft ? (
          "No pause time left: the film plays to the end."
        ) : moment.paused ? (
          <PauseLeft prefix="Plays again by itself in " />
        ) : (
          <PauseLeft prefix="Pause time left " />
        )}
      </p>
    </div>
  );
}

/**
 * A private suite's people and voice, above its chat. Everyone gets the microphone and who's
 * here, with a ring on whoever is talking. The host also lets knocking guests in, mutes or
 * removes guests, and pauses or moves the film for the whole suite.
 */
export function SuitePanel({ ticketId, alias }: { ticketId: string; alias: string | undefined }) {
  const suite = useRoom((state) => state.suite);
  const muted = useRoom((state) => state.muted);
  const connection = useRoom((state) => state.connection);
  const speaking = useVoice((state) => state.speaking);
  const micLocked = useVoice((state) => state.micLocked);
  const hostAlias = useHostAlias(ticketId);
  const colorOf = useMemberColors(ticketId);
  const [removing, setRemoving] = useState<SuiteMember | null>(null);
  if (!suite) return null;

  const host = suite.role === "host";
  const others = suite.guests.filter((guest) => guest.ticketId !== ticketId);
  // The host isn't in the guest list: anyone talking who isn't a guest or this viewer is them
  const hostSpeaking = speaking.some(
    (id) => id !== ticketId && !suite.guests.some((guest) => guest.ticketId === id),
  );
  const present = suite.guests.length + 1;

  return (
    <section
      aria-label="Your suite"
      className="space-y-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl"
    >
      <header className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Your suite · {present} of {suite.maxCapacity}
        </p>
        {host && others.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => connection?.muteAll()}>
            <MicOff data-icon="inline-start" />
            Mute all
          </Button>
        )}
      </header>

      <VoiceControls />

      <ul className="divide-y divide-white/6">
        <MemberRow
          name={host ? "You" : hostAlias || "Host"}
          color={hostAlias ? colorOf(hostAlias) : undefined}
          host
          speaking={host ? speaking.includes(ticketId) : hostSpeaking}
          muted={false}
        />
        {!host && (
          <MemberRow
            name={alias ? `You (${alias})` : "You"}
            color={alias ? colorOf(alias) : undefined}
            speaking={speaking.includes(ticketId)}
            // What the voice service says, the same as the microphone button
            muted={micLocked}
          />
        )}
        {others.map((guest) => {
          const guestMuted = muted[guest.ticketId] === true;
          return (
            <MemberRow
              key={guest.ticketId}
              name={guest.alias}
              color={colorOf(guest.alias)}
              speaking={speaking.includes(guest.ticketId)}
              muted={guestMuted}
              actions={
                host && (
                  <>
                    <IconAction
                      label={guestMuted ? `Unmute ${guest.alias}` : `Mute ${guest.alias}`}
                      onClick={() =>
                        connection?.guest(guestMuted ? "unmute" : "mute", guest.ticketId)
                      }
                    >
                      {guestMuted ? <Mic /> : <MicOff />}
                    </IconAction>
                    <IconAction label={`Remove ${guest.alias}`} onClick={() => setRemoving(guest)}>
                      <UserMinus />
                    </IconAction>
                  </>
                )
              }
            />
          );
        })}
      </ul>

      {host && suite.waiting.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-[0.18em] text-white/50 uppercase">Knocking</p>
          <ul className="space-y-2">
            {suite.waiting.map((guest) => (
              <li key={guest.ticketId} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{guest.alias}</span>
                <span className="flex shrink-0 gap-1.5">
                  <Button size="sm" onClick={() => connection?.guest("admit", guest.ticketId)}>
                    Let in
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => connection?.guest("deny", guest.ticketId)}
                  >
                    Not now
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {host && <PlaybackControls />}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `Remove ${removing.alias} from your suite?` : ""}
        consequences={[
          "They leave the film, the chat and the voice at once.",
          "They can knock again, and you decide whether to let them back in.",
        ]}
        confirmLabel="Remove"
        pendingLabel="Removing…"
        tone="danger"
        onConfirm={async () => {
          if (removing) connection?.guest("kick", removing.ticketId);
        }}
      />
    </section>
  );
}
