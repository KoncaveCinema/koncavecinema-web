import { create } from "zustand";

import type { RoomConnection, RoomConnectionStatus } from "@/api/rooms/rooms-socket";
import type { ChatMessage, RoomState, SuiteState } from "@/api/rooms/rooms-schemas";

/*
 * The room's chat while the screening room is open: what the socket last said, the messages
 * on screen, the ones on their way out, and the reactions floating over the film. The
 * connection itself lives in room-chat.tsx; the player reads the floating reactions from here.
 */

/** Messages kept on screen: enough to scroll back through, few enough to stay light */
export const MAX_MESSAGES = 200;
/** Reactions floating over the film at once */
export const MAX_FLOATING = 16;
/** How long a reaction floats before it's gone (the float-up animation's length) */
export const FLOAT_MS = 3_500;

export type RoomStatus = RoomConnectionStatus | "refused" | "closed";

/** A suite guest outside the suite: knocking, turned away for now, or removed by the host */
export type Admission = "waiting" | "denied" | "kicked";

export interface FloatingReaction {
  id: number;
  emoji: string;
  /** Across the picture, as a percentage of its width */
  left: number;
}

interface RoomStore {
  status: RoomStatus;
  /** Why the room refused, for the panel's one line */
  refusal: string | null;
  room: Omit<RoomState, "recent"> | null;
  messages: ChatMessage[];
  /**
   * Messages written and not yet back from the API, oldest first. Only the first is ever on the
   * wire; the API's pace decides when the next may go, and the panel never makes anyone wait
   */
  outbox: string[];
  /** The first of the outbox is sent and its echo hasn't come back */
  inFlight: boolean;
  floating: FloatingReaction[];
  draft: string;
  /** Set when the API removed everything in the last message */
  blocked: boolean;
  connection: RoomConnection | null;
  /** A suite's guests, knocks and playback clock; null in a hall */
  suite: SuiteState | null;
  /** Set while a suite guest isn't in the suite; null once they are, and in a hall */
  admission: Admission | null;
  /** Local time another knock may go, after a denial */
  knockAfter: number;
  /** Guests whose microphone the host has turned off, by ticket id */
  muted: Record<string, boolean>;
}

const EMPTY: RoomStore = {
  status: "connecting",
  refusal: null,
  room: null,
  messages: [],
  outbox: [],
  inFlight: false,
  floating: [],
  draft: "",
  blocked: false,
  connection: null,
  suite: null,
  admission: null,
  knockAfter: 0,
  muted: {},
};

export const useRoom = create<RoomStore>(() => EMPTY);

export function resetRoom() {
  useRoom.setState(EMPTY, true);
}

/**
 * New messages after the old, each once (a reconnect resends the recent ones), at most
 * MAX_MESSAGES, oldest dropped first.
 */
export function withMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const seen = new Set(current.map((message) => message.id));
  const added = incoming.filter((message) => !seen.has(message.id));
  if (added.length === 0) return current;
  return [...current, ...added].slice(-MAX_MESSAGES);
}

/** Sends the first waiting message, when the room is open and nothing else is on the wire */
export function sendNext() {
  const { status, connection, outbox, inFlight } = useRoom.getState();
  const next = outbox[0];
  if (status !== "open" || !connection || inFlight || next === undefined) return;
  connection.send(next);
  useRoom.setState({ inFlight: true });
}

/** The first waiting message is done with (delivered, or refused for good): on to the next */
export function settleFirst(changes: Partial<RoomStore> = {}) {
  useRoom.setState((state) => ({ ...changes, outbox: state.outbox.slice(1), inFlight: false }));
  sendNext();
}

let nextReaction = 0;

/** A reaction joins those floating; the oldest gives way past MAX_FLOATING */
export function withReaction(current: FloatingReaction[], emoji: string): FloatingReaction[] {
  nextReaction += 1;
  const left = 8 + ((nextReaction * 37) % 84);
  return [...current, { id: nextReaction, emoji, left }].slice(-MAX_FLOATING);
}

/** Floats a reaction over the film for FLOAT_MS */
export function floatReaction(emoji: string) {
  const floating = withReaction(useRoom.getState().floating, emoji);
  const id = floating.at(-1)?.id;
  useRoom.setState({ floating });
  setTimeout(
    () => useRoom.setState((state) => ({ floating: state.floating.filter((r) => r.id !== id) })),
    FLOAT_MS,
  );
}
