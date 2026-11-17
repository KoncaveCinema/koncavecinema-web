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
