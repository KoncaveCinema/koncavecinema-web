import { z } from "zod";

/*
 * The events the screening room reads on the API's /rooms socket, checked against
 * koncavecinema-api's gateway (dev, 1654026: src/rooms/rooms.gateway.ts and the Phase 6 doc):
 * only the fields the room uses.
 */

/** The API's limit on one message, in characters */
export const MESSAGE_MAX_LENGTH = 280;

/** The hall's reactions, in the API's order; anything else is refused */
export const REACTIONS = ["👏", "😂", "😮", "❤️", "🔥", "😢"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** `message`, and each entry of `room_state.recent` (which has no `mine`) */
export const chatMessageSchema = z.object({
  id: z.string(),
  senderAlias: z.string(),
  /** Already filtered by the API: links and phone numbers removed. Plain text, never HTML */
  text: z.string(),
  sentAt: z.iso.datetime(),
  mine: z.boolean().optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** `room_state`: the answer to join_room */
export const roomStateSchema = z.object({
  kind: z.enum(["hall", "suite"]),
  /** The hall number in a public screening; null in a suite */
  hall: z.number().int().nullable(),
  members: z.number().int(),
  /** The last messages, oldest first */
  recent: z.array(chatMessageSchema),
  accessEndsAt: z.iso.datetime(),
});
export type RoomState = z.infer<typeof roomStateSchema>;

/** `room_members`, at most every 5 seconds */
export const roomMembersSchema = z.object({ members: z.number().int() });

/** `reaction` (halls only) */
export const reactionSchema = z.object({ emoji: z.string(), senderAlias: z.string() });

/**
 * `rate_limit_exceeded`, to the refused member only. Messages: 3 in a row, then one every 3 s;
 * reactions: 5 at once, refilling at 5 a second (dev, token buckets). `retryAfterMs` is exact
 */
export const rateLimitSchema = z.object({
  retryAfterSeconds: z.number(),
  retryAfterMs: z.number().optional(),
});

/** `room_error`: a refusal, with the HTTP error codes, and the event it answers */
export const roomErrorSchema = z.object({
  code: z.string(),
  event: z.string().optional(),
});
export type RoomError = z.infer<typeof roomErrorSchema>;

/** The `data` of a refused handshake (`connect_error`) */
export const handshakeErrorSchema = z.object({ code: z.string() });

/* Private suites (dev 5f0ce91): admission, the host's controls and the shared playback clock */

/** A guest of the suite: admitted, or knocking */
export const suiteMemberSchema = z.object({ ticketId: z.string(), alias: z.string() });
export type SuiteMember = z.infer<typeof suiteMemberSchema>;

/**
 * The suite's playback clock as the API holds it. Running, the film is at `position` plus the
 * time since `serverTime`; paused, at `position`. A pause that uses up the allowance resumes on
 * the API's side at that moment, with no event (see suite-clock.ts)
 */
export const suiteClockSchema = z.object({
  isPaused: z.boolean(),
  position: z.number(),
  serverTime: z.iso.datetime(),
  pauseRemainingSeconds: z.number(),
});
export type SuiteClock = z.infer<typeof suiteClockSchema>;

/** `suite_state`, pushed to everyone in the suite whenever anything changes */
export const suiteStateSchema = z.object({
  role: z.enum(["host", "guest"]),
  /** Admitted guests; the host isn't among them */
  guests: z.array(suiteMemberSchema),
  /** Knocking guests, for the host only (always empty for guests) */
  waiting: z.array(suiteMemberSchema),
  clock: suiteClockSchema,
  maxCapacity: z.number().int(),
});
export type SuiteState = z.infer<typeof suiteStateSchema>;

/** `admitted`: the host let this guest in (the app then joins again) */
export const admittedSchema = z.object({ clock: suiteClockSchema });
/** `denied`: not let in; another knock is possible after the wait */
export const deniedSchema = z.object({ retryAfterSeconds: z.number() });
/** `admission_request`, to the host on each knock */
export const admissionRequestSchema = suiteMemberSchema;
/** `guest_muted`: the host revoked or restored a guest's microphone */
export const guestMutedSchema = z.object({ ticketId: z.string(), muted: z.boolean() });
/** `voice_participant_left`: LiveKit saw a member leave voice */
export const voiceLeftSchema = z.object({ ticketId: z.string() });
/** Events with nothing in them: `waiting`, `kicked` */
export const emptyEventSchema = z.object({});

/** POST /rooms/voice-token (dev 5f0ce91): an audio-only LiveKit token for the suite */
export const voiceTokenSchema = z.object({
  token: z.string(),
  url: z.string(),
  /** The member's identity in the voice room: their ticket id */
  identity: z.string(),
  /** True where LiveKit isn't configured (local, tests): there is no room to join */
  simulated: z.boolean(),
});
export type VoiceToken = z.infer<typeof voiceTokenSchema>;
