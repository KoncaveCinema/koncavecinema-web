import { useMutation, useQuery } from "@tanstack/react-query";

import { env } from "@/env";

import { ErrorCode, toApiError } from "../errors";
import { http } from "../http";
import {
  drmTokenSchema,
  heartbeatSchema,
  playbackAuthorizationSchema,
  type DrmToken,
  type PlaybackAuthorization,
} from "./stream-security-schemas";

/*
 * Playback calls (koncavecinema-api docs/integrations: streaming-and-drm), each parsing its
 * reply, and their hooks. One device holds a pass at a time: authorising takes a lease, the
 * heartbeat keeps it, Secure Stop gives it back.
 */

/* This device's playback session id, per pass, for this tab. It isn't a sign-in token: it lets
   a reload pick up the same lease instead of colliding with itself as "another device". */

const sessionKey = (ticketId: string) => `kc-watch-session:${ticketId}`;

function readPlaybackSession(ticketId: string): string | null {
  try {
    return sessionStorage.getItem(sessionKey(ticketId));
  } catch {
    return null;
  }
}

function writePlaybackSession(ticketId: string, sessionId: string | null) {
  try {
    if (sessionId) sessionStorage.setItem(sessionKey(ticketId), sessionId);
    else sessionStorage.removeItem(sessionKey(ticketId));
  } catch {
    // Storage blocked: a reload starts a new session once the old lease lapses
  }
}

/** POST /stream-security/authorize-playback: the stream, its tokens and this device's lease */
export async function authorizePlayback(ticketId: string): Promise<PlaybackAuthorization> {
  const authorization = playbackAuthorizationSchema.parse(
    await http({
      url: "/stream-security/authorize-playback",
      method: "POST",
      data: { ticketId, sessionId: readPlaybackSession(ticketId) ?? undefined },
    }),
  );
  writePlaybackSession(ticketId, authorization.sessionId);
  return authorization;
}

/** POST /stream-security/heartbeat: keeps the lease, on the interval authorisation gave */
export async function heartbeat(ticketId: string, sessionId: string): Promise<void> {
  heartbeatSchema.parse(
    await http({
      url: "/stream-security/heartbeat",
      method: "POST",
      data: { ticketId, sessionId },
    }),
  );
}

/** POST /stream-security/refresh-drm-token: a DRM film's licence token lasts 5 minutes */
export async function refreshDrmToken(ticketId: string, sessionId: string): Promise<DrmToken> {
  return drmTokenSchema.parse(
    await http({
      url: "/stream-security/refresh-drm-token",
      method: "POST",
      data: { ticketId, sessionId },
    }),
  );
}

/**
 * POST /stream-security/secure-stop: gives the lease back as the page closes. A beacon outlives
 * the page, and sends text/plain without an Authorization header, which the API accepts here.
 */
export function secureStop(ticketId: string, sessionId: string) {
  writePlaybackSession(ticketId, null);
  navigator.sendBeacon(
    `${env.NEXT_PUBLIC_API_URL}/stream-security/secure-stop`,
    JSON.stringify({ ticketId, sessionId }),
  );
}

/** POST /stream-security/location-verification/send-code: emails a code, valid 5 minutes */
export async function sendLocationCode(): Promise<void> {
  await http({ url: "/stream-security/location-verification/send-code", method: "POST" });
}

/** POST /stream-security/location-verification/confirm */
export async function confirmLocation(code: string): Promise<void> {
  await http({
    url: "/stream-security/location-verification/confirm",
    method: "POST",
    data: { code },
  });
}

/* Hooks */

/**
 * Asked once the doors open, and again only as a new `attempt` (the viewer's "Try again"): it
 * takes a lease, so it is never cached or refetched by itself. A POST, yet a query: it runs on
 * its own when the room is ready.
 */
export function useAuthorizePlayback(ticketId: string, attempt: number, enabled: boolean) {
  return useQuery({
    queryKey: ["/stream-security/authorize-playback", ticketId, attempt],
    queryFn: () => authorizePlayback(ticketId),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Our clock and the API's can disagree by a moment at the door: ask again shortly
    retry: (count, error) => toApiError(error).is(ErrorCode.STREAM_NOT_OPEN) && count < 8,
    retryDelay: 15_000,
  });
}

/** Refetches nothing: once confirmed, the room asks for playback again */
export function useSendLocationCode() {
  return useMutation({ mutationKey: ["sendLocationCode"], mutationFn: sendLocationCode });
}

export function useConfirmLocation() {
  return useMutation({ mutationKey: ["confirmLocation"], mutationFn: confirmLocation });
}
