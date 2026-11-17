import type { z } from "zod";

import { env } from "@/env";

import { getAccessToken } from "../access-token";
import { refreshAccessToken } from "../client";
import { ErrorCode } from "../errors";
import {
  admissionRequestSchema,
  admittedSchema,
  deniedSchema,
  emptyEventSchema,
  guestMutedSchema,
  suiteClockSchema,
  suiteStateSchema,
  voiceLeftSchema,
  type SuiteClock,
  type SuiteMember,
  type SuiteState,
  chatMessageSchema,
  handshakeErrorSchema,
  rateLimitSchema,
  reactionSchema,
  roomErrorSchema,
  roomMembersSchema,
  roomStateSchema,
  type ChatMessage,
  type Reaction,
  type RoomError,
  type RoomState,
} from "./rooms-schemas";

/*
 * The screening room's live channel: Socket.IO on the API's own server, namespace /rooms
 * (dev 1654026). socket.io-client loads only when a room pass opens its doors. Every event is
 * parsed like an HTTP reply; one that doesn't match is ignored rather than trusted.
 */

export type RoomConnectionStatus = "connecting" | "open" | "reconnecting" | "signed-out";

export interface RoomHandlers {
  onStatus: (status: RoomConnectionStatus) => void;
  onState: (state: RoomState) => void;
  onMembers: (members: number) => void;
  onMessage: (message: ChatMessage) => void;
  onReaction: (reaction: z.infer<typeof reactionSchema>) => void;
  /** The exact wait before the refused message may go again, in milliseconds */
  onRateLimited: (retryAfterMs: number) => void;
  onRefused: (error: RoomError) => void;
  // Suites
  onSuiteState: (state: SuiteState) => void;
  /** A guest outside the suite, waiting for the host */
  onWaiting: () => void;
  /** The host let this guest in; the connection has already asked to join again */
  onAdmitted: (clock: SuiteClock) => void;
  onDenied: (retryAfterSeconds: number) => void;
  /** The host removed this guest; the connection stays closed until they knock again */
  onKicked: () => void;
  /** To the host: a guest is knocking */
  onAdmissionRequest: (guest: SuiteMember) => void;
  onGuestMuted: (ticketId: string, muted: boolean) => void;
  /** The host paused, resumed or moved the film */
  onClock: (clock: SuiteClock) => void;
  onVoiceLeft: (ticketId: string) => void;
}

/** The host's controls, each about a guest's pass */
export type GuestAction = "admit" | "deny" | "kick" | "mute" | "unmute";
/** The host's playback: a pause without a position freezes the film where the API's clock is */
export type PlaybackAction =
  | { action: "pause"; position?: number }
  | { action: "resume" }
  | { action: "seek"; position: number };

export interface RoomConnection {
  send: (text: string) => void;
  react: (emoji: Reaction) => void;
  /** Asks to join again, after a refusal that may have passed (the lobby opening) */
  rejoin: () => void;
  /** A guest removed from a suite asks to come back in: a fresh connection, a fresh knock */
  knock: () => void;
  guest: (action: GuestAction, ticketId: string) => void;
  muteAll: () => void;
  playback: (action: PlaybackAction) => void;
  close: () => void;
}

/** A dropped instance's sockets reconnect after this, so they reach the new one */
const RESTART_DELAY_MS = 1_000;

export async function connectToRoom(
  ticketId: string,
  handlers: RoomHandlers,
): Promise<RoomConnection> {
  const { io } = await import("socket.io-client");
  // The API's own origin: its global /api prefix doesn't apply to the socket. Locally that is
  // this app, which forwards /socket.io to staging like /api (next.config.ts)
  const socket = io(`${new URL(env.NEXT_PUBLIC_API_URL).origin}/rooms`, {
    transports: ["websocket"],
    // Read at every attempt, so a reconnect presents the current token, never a stale one
    auth: (send) => send({ token: getAccessToken() }),
  });

  function on<T>(event: string, schema: z.ZodType<T>, handle: (payload: T) => void) {
    socket.on(event, (payload: unknown) => {
      const parsed = schema.safeParse(payload);
      if (parsed.success) handle(parsed.data);
    });
  }

  const join = () => socket.emit("join_room", { ticketId });
  // One token refresh per refusal: a second refusal in a row means the session has ended
  let refreshed = false;
  // Removed from a suite by its host: the API drops the socket, and it stays down
  let kicked = false;

  socket.on("connect", () => {
    refreshed = false;
    handlers.onStatus("open");
    join();
  });
  socket.on("connect_error", (error: Error & { data?: unknown }) => {
    const refusal = handshakeErrorSchema.safeParse(error.data);
    // A network failure: Socket.IO tries again on its own, with back-off
    if (!refusal.success) return handlers.onStatus("reconnecting");
    if (refusal.data.code === ErrorCode.UNAUTHORIZED && !refreshed) {
      refreshed = true;
      void refreshAccessToken().then((token) =>
        token ? socket.connect() : handlers.onStatus("signed-out"),
      );
      return;
    }
    handlers.onStatus("signed-out");
  });
  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return;
    handlers.onStatus("reconnecting");
    // The API dropped it (a deploy draining): Socket.IO won't come back by itself. After a
    // kick it mustn't: the guest knocks again only if they choose to
    if (reason === "io server disconnect" && !kicked) {
      setTimeout(() => socket.connect(), RESTART_DELAY_MS);
    }
  });
  socket.on("server_restarting", () => handlers.onStatus("reconnecting"));

  on("room_state", roomStateSchema, handlers.onState);
  on("room_members", roomMembersSchema, ({ members }) => handlers.onMembers(members));
  on("message", chatMessageSchema, handlers.onMessage);
  on("reaction", reactionSchema, handlers.onReaction);
  on("rate_limit_exceeded", rateLimitSchema, ({ retryAfterSeconds, retryAfterMs }) =>
    handlers.onRateLimited(retryAfterMs ?? retryAfterSeconds * 1000),
  );
  on("suite_state", suiteStateSchema, handlers.onSuiteState);
  on("waiting", emptyEventSchema, () => handlers.onWaiting());
  on("admitted", admittedSchema, ({ clock }) => {
    // In now: join again to receive the suite's room_state and suite_state
    join();
    handlers.onAdmitted(clock);
  });
  on("denied", deniedSchema, ({ retryAfterSeconds }) => handlers.onDenied(retryAfterSeconds));
  on("kicked", emptyEventSchema, () => {
    kicked = true;
    handlers.onKicked();
  });
  on("admission_request", admissionRequestSchema, handlers.onAdmissionRequest);
  on("guest_muted", guestMutedSchema, ({ ticketId, muted }) =>
    handlers.onGuestMuted(ticketId, muted),
  );
  on("room_playback_synced", suiteClockSchema, handlers.onClock);
  on("voice_participant_left", voiceLeftSchema, ({ ticketId }) => handlers.onVoiceLeft(ticketId));
  on("room_error", roomErrorSchema, (error) => {
    // Sent before the room took us back (a reconnect): join, and the next message goes through
    if (error.code === ErrorCode.ROOM_NOT_JOINED) join();
    handlers.onRefused(error);
  });

  return {
    send: (text) => socket.emit("send_message", { text }),
    react: (emoji) => socket.emit("send_reaction", { emoji }),
    rejoin: join,
    knock: () => {
      kicked = false;
      if (socket.connected) join();
      else socket.connect();
    },
    guest: (action, guestTicketId) => socket.emit(action, { ticketId: guestTicketId }),
    muteAll: () => socket.emit("mute_all"),
    playback: (action) => socket.emit("playback", action),
    close: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
