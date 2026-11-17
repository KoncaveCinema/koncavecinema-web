import { http } from "../http";
import { voiceTokenSchema } from "./rooms-schemas";

/**
 * POST /rooms/voice-token (dev 5f0ce91): the suite's audio-only LiveKit token, for the host or
 * an admitted guest. Refused with SUITE_NOT_ADMITTED before the host lets a guest in, and
 * VOICE_NOT_AVAILABLE when LiveKit can't be reached; 10 a minute.
 */
export async function requestVoiceToken(ticketId: string) {
  return voiceTokenSchema.parse(
    await http({ url: "/rooms/voice-token", method: "POST", data: { ticketId } }),
  );
}
