// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import { cn } from "cn";
import { ArrowDown, Loader, MessageSquareOff, SendHorizontal, WifiOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { toast } from "sonner";

import { ErrorCode } from "@/api";
import { getQueryClient } from "@/api/query-client";
import { connectToRoom, type RoomConnection, type RoomHandlers } from "@/api/rooms/rooms-socket";
import {
  MESSAGE_MAX_LENGTH,
  REACTIONS,
  type ChatMessage,
  type Reaction,
} from "@/api/rooms/rooms-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/features/auth/session";
import { formatClock } from "@/lib/format";

import {
  floatReaction,
  resetRoom,
  sendNext,
  settleFirst,
  useRoom,
  withMessages,
} from "./room-store";
import { useMemberColors } from "./member-color";
import { voiceLeft } from "./suite-voice";

/** Asking again after "the room isn't open yet" (a clock a few seconds apart from the API's) */
const REJOIN_MS = 15_000;

const myAlias = () => useSession.getState().user?.publicScreenAlias ?? undefined;

/** The host's controls, whose refusals show as a toast rather than in the chat */
const HOST_ACTIONS = new Set(["admit", "deny", "kick", "mute", "unmute", "mute_all", "playback"]);
const knockToast = (ticketId: string) => `knock-${ticketId}`;

function hostRefusal(code: string, event: string): string {
  if (code === ErrorCode.SUITE_PAUSE_ALLOWANCE_USED) {
    return "No pause time left: the film keeps playing.";
  }
  if (code === ErrorCode.CONFLICT && event === "playback")
    return "Pause first, then move the film.";
  // Out of date (a guest who already left, a second tab): the next suite_state puts it right
  return "That didn't go through. Your suite's list is up to date again.";
}

/**
 * Connects to the room's chat while `enabled` (a Public or suite pass with its doors open) and
 * keeps the store current. The film never depends on it: a failure here only shows in the panel.
 */
export function useRoomChat(ticketId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    resetRoom();
    let cancelled = false;
    let connection: RoomConnection | undefined;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (run: () => void, ms: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    };
    const set = useRoom.setState;

    const handlers: RoomHandlers = {
      // Open once the room has answered (room_state), not when the socket connects. A message
      // on the wire when the line dropped won't be echoed: it goes again once the room is back
      onStatus: (status) =>
        set({ status: status === "open" ? "connecting" : status, inFlight: false }),
      onState: ({ recent, ...room }) => {
        set((state) => ({
          status: "open",
          refusal: null,
          room,
          messages: withMessages(state.messages, recent),
        }));
        sendNext();
      },
      onMembers: (members) => set((state) => ({ room: state.room && { ...state.room, members } })),
      onMessage: (message) => {
        set((state) => ({ messages: withMessages(state.messages, [message]) }));
        // Our own message came back: the first waiting one is delivered
        if (message.mine && useRoom.getState().outbox.length > 0) settleFirst();
      },
      // The presser's own reactions already floated when pressed
      onReaction: ({ emoji, senderAlias }) => {
        if (senderAlias !== myAlias()) floatReaction(emoji);
      },
      // A refused message goes again when the API allows; a refused reaction is let go
      onRateLimited: (waitMs) => {
        if (!useRoom.getState().inFlight) return;
        set({ inFlight: false });
        later(sendNext, waitMs);
      },
      onSuiteState: (suite) => {
        // A knock that's no longer waiting (let in, turned away, gone) needs no prompt
        for (const guest of useRoom.getState().suite?.waiting ?? []) {
          if (!suite.waiting.some((knock) => knock.ticketId === guest.ticketId)) {
            toast.dismiss(knockToast(guest.ticketId));
          }
        }
        set({ suite, admission: null });
      },
      onWaiting: () => set({ admission: "waiting" }),
      onAdmitted: (clock) =>
        set((state) => ({ admission: null, suite: state.suite && { ...state.suite, clock } })),
      onDenied: (seconds) => set({ admission: "denied", knockAfter: Date.now() + seconds * 1000 }),
      onKicked: () => {
        resetRoom();
        set({ admission: "kicked", connection: connection ?? null });
      },
      onAdmissionRequest: ({ ticketId: guest, alias }) =>
        toast(`${alias} is knocking`, {
          id: knockToast(guest),
          description: "They'd like to join your suite.",
          duration: Infinity,
          action: { label: "Let in", onClick: () => connection?.guest("admit", guest) },
          cancel: { label: "Not now", onClick: () => connection?.guest("deny", guest) },
        }),
      // The host's list; a guest's own lock follows the voice service (suite-voice.ts)
      onGuestMuted: (guest, muted) =>
        set((state) => ({ muted: { ...state.muted, [guest]: muted } })),
      onClock: (clock) => {
        const wasPaused = useRoom.getState().suite?.clock.isPaused;
        set((state) => ({ suite: state.suite && { ...state.suite, clock } }));
        // A pause moves the pass's end of access later: read it again rather than keep the old
        if (wasPaused && !clock.isPaused) {
          void getQueryClient().invalidateQueries({ queryKey: [`/tickets/${ticketId}`] });
        }
      },
      onVoiceLeft: voiceLeft,
      onRefused: ({ code, event }) => {
        if (code === ErrorCode.STREAM_CLOSED) return set({ status: "closed", inFlight: false });
        if (event && HOST_ACTIONS.has(event)) return toast.error(hostRefusal(code, event));
        if (event === "send_reaction") return;
        if (event === "send_message") {
          // Nothing left once links and numbers were removed: back in the box to rewrite
          if (code === ErrorCode.MESSAGE_BLOCKED) {
            const { outbox, draft } = useRoom.getState();
            return settleFirst({ blocked: true, draft: draft || (outbox[0] ?? "") });
          }
          // Sent before the room took us back: it goes again with the next room_state
          if (code === ErrorCode.ROOM_NOT_JOINED) return set({ inFlight: false });
          return settleFirst();
        }
        // join_room's refusals
        set({ status: "refused", refusal: code });
        if (code === ErrorCode.STREAM_NOT_OPEN) later(() => connection?.rejoin(), REJOIN_MS);
      },
    };

    // A tick later, so React's development double mount never opens a socket only to close it
    const start = setTimeout(() => {
      connectToRoom(ticketId, handlers).then(
        (opened) => {
          if (cancelled) return opened.close();
          connection = opened;
          set({ connection });
        },
        () => !cancelled && set({ status: "refused", refusal: ErrorCode.NETWORK_ERROR }),
      );
    });

    return () => {
      cancelled = true;
      clearTimeout(start);
      connection?.close();
      for (const timer of timers) clearTimeout(timer);
      resetRoom();
    };
  }, [ticketId, enabled]);
}

function send(event: FormEvent) {
  event.preventDefault();
  const text = useRoom.getState().draft.trim();
  if (!text || text.length > MESSAGE_MAX_LENGTH) return;
  useRoom.setState((state) => ({ outbox: [...state.outbox, text], draft: "", blocked: false }));
  sendNext();
}

/**
 * Floats at once for the presser and goes straight to the room. Past the API's burst of 5 a
 * press is refused and let go: it already floated here, and reactions are of the moment
 */
function react(emoji: Reaction) {
  floatReaction(emoji);
  // Not while a message is on the wire (a moment): a refusal then could only be read as the
  // message's, since the event doesn't say which it answers
  if (useRoom.getState().inFlight) return;
  useRoom.getState().connection?.react(emoji);
}

/** The one line a closed or refused room shows instead of the composer */
function notice(status: string, refusal: string | null): string | null {
  if (status === "closed") return "Chat has closed for this screening.";
  if (status === "signed-out") return "Your session ended. Sign in again to chat.";
  if (status !== "refused") return null;
  switch (refusal) {
    case ErrorCode.KYC_REQUIRED:
      return "Public hall chat needs a verified phone number.";
    case ErrorCode.SUITE_NOT_ACTIVE:
      return "Chat opens once the suite is paid for.";
    case ErrorCode.STREAM_NOT_OPEN:
      return "Chat opens with the lobby.";
    default:
      return "Chat is unavailable right now.";
  }
}

/**
 * The messages, and those on their way out. Re-renders only when either changes: the clocks
 * around the room tick without touching it.
 */
function MessageList({ ticketId }: { ticketId: string }) {
  const messages = useRoom((state) => state.messages);
  const outbox = useRoom((state) => state.outbox);
  const status = useRoom((state) => state.status);
  const alias = useSession((state) => state.user?.publicScreenAlias);
  const colorOf = useMemberColors(ticketId);

  const list = useRef<HTMLOListElement>(null);
  const [following, setFollowing] = useState(true);
  // The last message on screen when the viewer scrolled up; anything after it is unseen
  const [seenId, setSeenId] = useState<string | undefined>(undefined);
  const lastId = messages.at(-1)?.id;
  const unseen = !following && lastId !== seenId;

  // Follow new messages, unless the viewer has scrolled up to read
  useEffect(() => {
    const element = list.current;
    if (element && following) element.scrollTop = element.scrollHeight;
  }, [lastId, outbox.length, following]);

  const onScroll = () => {
    const element = list.current;
    if (!element) return;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
    if (following && !atBottom) setSeenId(lastId);
    setFollowing(atBottom);
  };

  const line = (message: ChatMessage) => {
    const mine = message.mine ?? (alias != null && message.senderAlias === alias);
    return (
      <li key={message.id} className="wrap-break-word">
        <span className="font-semibold" style={{ color: colorOf(message.senderAlias) }}>
          {mine ? "You" : message.senderAlias}
        </span>{" "}
        <span className="text-white/90">{message.text}</span>
      </li>
    );
  };

  return (
    <div className="relative min-h-0 flex-1">
      <ol
        ref={list}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        className="h-full space-y-2.5 overflow-y-auto px-4 py-3 text-sm"
      >
        {messages.map(line)}
        {outbox.map((text, index) => (
          <li key={`out-${index}`} className="wrap-break-word opacity-50">
            <span className="font-semibold" style={alias ? { color: colorOf(alias) } : undefined}>
              You
            </span>{" "}
            <span className="text-white/90">{text}</span>{" "}
            <span className="text-xs text-white/50">Sending…</span>
          </li>
        ))}
        {messages.length === 0 && outbox.length === 0 && status === "open" && (
          <li className="py-6 text-center text-white/40">No messages yet. Say hello.</li>
        )}
      </ol>
      {unseen && (
        <Button
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2"
          onClick={() => setFollowing(true)}
        >
          <ArrowDown data-icon="inline-start" />
          New messages
        </Button>
      )}
    </div>
  );
}

/**
 * The room's chat, beside the film on wide screens and under it on phones: who's here, the
 * messages, and the composer. Halls add a row of reactions that float up over the film.
 * `closing`: the film is over, so the header says when chat closes too.
 */
export function RoomChat({
  ticketId,
  closing = false,
  className,
}: {
  /** This viewer's pass: in a suite it places them among the members for the colours */
  ticketId: string;
  closing?: boolean;
  className?: string;
}) {
  const status = useRoom((state) => state.status);
  const refusal = useRoom((state) => state.refusal);
  const room = useRoom((state) => state.room);
  const draft = useRoom((state) => state.draft);
  const blocked = useRoom((state) => state.blocked);
  const connection = useRoom((state) => state.connection);

  const tooLong = draft.length > MESSAGE_MAX_LENGTH;
  const canSend = status === "open" && draft.trim() !== "" && !tooLong;
  const closedLine = notice(status, refusal);
  const header = !room
    ? "Chat"
    : room.kind === "hall"
      ? `Hall ${room.hall ?? 1} · ${room.members.toLocaleString("en-NG")} watching`
      : `Your suite · ${room.members} here`;
  // The viewer's own timezone: this panel only renders in the browser, once the room answers
  const closesAt =
    closing && room && status === "open"
      ? formatClock(room.accessEndsAt, Intl.DateTimeFormat().resolvedOptions().timeZone)
      : null;

  return (
    <section
      aria-label="Chat"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{header}</p>
          {closesAt && <p className="text-xs text-white/50">Chat closes at {closesAt}</p>}
        </div>
        {(status === "connecting" || status === "reconnecting") && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/50">
            {status === "connecting" ? (
              <Loader aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <WifiOff aria-hidden="true" className="size-3.5" />
            )}
            {status === "connecting" ? "Joining…" : "Reconnecting…"}
          </span>
        )}
      </header>

      <MessageList ticketId={ticketId} />

      <footer className="space-y-3 border-t border-white/8 p-3">
        {closedLine ? (
          <div className="flex items-center justify-between gap-3 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <MessageSquareOff aria-hidden="true" className="size-4 shrink-0" />
              {closedLine}
            </span>
            {status === "refused" && refusal !== ErrorCode.STREAM_NOT_OPEN && connection && (
              <Button size="sm" variant="outline" onClick={() => connection?.rejoin()}>
                Try again
              </Button>
            )}
          </div>
        ) : (
          <>
            {room?.kind === "hall" && (
              <div className="flex justify-between gap-1" aria-label="Reactions">
                {REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    aria-label={`React ${emoji}`}
                    disabled={status !== "open"}
                    className="text-lg active:scale-90"
                    onClick={() => react(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            )}
            <form onSubmit={send} className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(event) =>
                  useRoom.setState({ draft: event.target.value, blocked: false })
                }
                placeholder={status === "open" ? "Say something…" : "Joining the room…"}
                aria-label="Message"
                aria-invalid={tooLong || blocked}
                autoComplete="off"
                disabled={status !== "open"}
              />
              <Button type="submit" size="icon" aria-label="Send" disabled={!canSend}>
                <SendHorizontal />
              </Button>
            </form>
            {(blocked || draft.length > MESSAGE_MAX_LENGTH - 40) && (
              <p className={cn("text-xs", blocked || tooLong ? "text-[#ff5a63]" : "text-white/45")}>
                {blocked
                  ? "Links and phone numbers are removed, which left nothing to send."
                  : `${draft.length} / ${MESSAGE_MAX_LENGTH}`}
              </p>
            )}
          </>
        )}
      </footer>
    </section>
  );
}

/** Hall reactions rising over the film, inside the player's frame so full screen keeps them */
export function FloatingReactions() {
  const floating = useRoom((state) => state.floating);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {floating.map((reaction) => (
        <span
          key={reaction.id}
          className="absolute bottom-16 animate-float-up text-3xl motion-reduce:animate-none motion-reduce:opacity-80"
          style={{ left: `${reaction.left}%` }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}
