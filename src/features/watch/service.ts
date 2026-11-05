import { env } from "@/env";
import { api } from "@/lib/api";
import { isDemo } from "@/lib/demo";

import type { DrmTokenRefresh, HeartbeatResponse, PlaybackAuthorization } from "./api-types";
import * as demo from "./demo";

/*
 * Playback calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays
 * the API's part, with its timings and error codes.
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

export async function authorizePlayback(ticketId: string): Promise<PlaybackAuthorization> {
  const sessionId = readPlaybackSession(ticketId) ?? undefined;
  const authorization = isDemo
    ? await demo.authorizePlayback(ticketId)
    : await api.post<PlaybackAuthorization>("/stream-security/authorize-playback", {
        ticketId,
        sessionId,
      });
  writePlaybackSession(ticketId, authorization.sessionId);
  return authorization;
}

export function heartbeat(ticketId: string, sessionId: string): Promise<HeartbeatResponse> {
  if (isDemo) return demo.heartbeat(ticketId);
  return api.post<HeartbeatResponse>("/stream-security/heartbeat", { ticketId, sessionId });
}

/** A DRM film's licence token lasts 5 minutes; the player renews it before then. The demo's
    film has no DRM, so it never asks. */
export function refreshDrmToken(ticketId: string, sessionId: string): Promise<DrmTokenRefresh> {
  return api.post<DrmTokenRefresh>("/stream-security/refresh-drm-token", { ticketId, sessionId });
}

/**
 * Releases the lease as the page closes. A beacon outlives the page, and sends text/plain
 * without an Authorization header, which the API's secure-stop is built for.
 */
export function secureStop(ticketId: string, sessionId: string) {
  writePlaybackSession(ticketId, null);
  if (isDemo) return;
  navigator.sendBeacon(
    `${env.NEXT_PUBLIC_API_URL}/stream-security/secure-stop`,
    JSON.stringify({ ticketId, sessionId }),
  );
}

/** Emails a code to confirm an unusual viewing location (valid 5 minutes) */
export async function sendLocationCode(): Promise<void> {
  if (isDemo) return demo.sendLocationCode();
  await api.post("/stream-security/location-verification/send-code");
}

export async function confirmLocation(code: string): Promise<void> {
  if (isDemo) return demo.confirmLocation(code);
  await api.post("/stream-security/location-verification/confirm", { code });
}
