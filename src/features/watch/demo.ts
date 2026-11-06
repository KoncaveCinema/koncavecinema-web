import type { UserProfile } from "@/api/auth/auth-schemas";
import { getTicket } from "@/features/booking/demo";
import { ErrorCode } from "@/api";
import { demoDelay, demoError, readDemoStore, writeDemoStore } from "@/lib/demo";
import { LOBBY_OPENS_BEFORE_MS } from "@/lib/screening-window";

import type { HeartbeatResponse, PlaybackAuthorization } from "./api-types";

/*
 * The playback demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): the API's checks on the demo passes'
 * real times, and the client's public teaser on Mux (no token, no DRM) as the film. A reviewer
 * can make the next call fail with any refusal from the watch page's demo switcher.
 */

const DEMO_PLAYBACK_ID = "tgzz2gfKV6uz00p8qW7iJFdirInYmn1dbkd3Yug6hiE00";
const REFUSAL_KEY = "kc-demo-watch-refusal";
const LOCATION_KEY = "kc-demo-location-pending";

/** The refusals the switcher offers, each as the API sends it */
export const DEMO_REFUSALS = {
  [ErrorCode.STREAM_IN_USE_ON_ANOTHER_DEVICE]: { label: "Another device", status: 409 },
  [ErrorCode.LOCATION_VERIFICATION_REQUIRED]: { label: "Unusual location", status: 403 },
  [ErrorCode.STREAM_NOT_READY]: { label: "Film not ready", status: 409 },
  [ErrorCode.STREAM_SESSION_INVALID]: { label: "Taken over", status: 409 },
  [ErrorCode.STREAM_CLOSED]: { label: "Screening ended", status: 403 },
} as const;

export type DemoRefusal = keyof typeof DEMO_REFUSALS;

/** Demo only: the next playback call answers with this refusal, once */
export function setDemoRefusal(code: DemoRefusal) {
  writeDemoStore(REFUSAL_KEY, code);
}

/** The pending refusal, if it belongs to this call; it's used up either way */
function takeRefusal(allowed: DemoRefusal[]) {
  const code = readDemoStore<DemoRefusal | null>(REFUSAL_KEY, null);
  if (!code || !allowed.includes(code)) return;
  writeDemoStore(REFUSAL_KEY, null);
  if (code === ErrorCode.LOCATION_VERIFICATION_REQUIRED) writeDemoStore(LOCATION_KEY, true);
  throw demoError(code, DEMO_REFUSALS[code].label, DEMO_REFUSALS[code].status);
}

export async function authorizePlayback(ticketId: string): Promise<PlaybackAuthorization> {
  const ticket = await getTicket(ticketId);
  await demoDelay(600);
  takeRefusal([
    ErrorCode.STREAM_IN_USE_ON_ANOTHER_DEVICE,
    ErrorCode.LOCATION_VERIFICATION_REQUIRED,
    ErrorCode.STREAM_NOT_READY,
    ErrorCode.STREAM_CLOSED,
  ]);

  const now = Date.now();
  if (ticket.status !== "CONFIRMED" && ticket.status !== "CHECKED_IN") {
    throw demoError(ErrorCode.PASS_NOT_CONFIRMED, "This pass has not been paid for.", 403);
  }
  if (now < Date.parse(ticket.startTime) - LOBBY_OPENS_BEFORE_MS) {
    throw demoError(ErrorCode.STREAM_NOT_OPEN, "The lobby is not open yet.", 403);
  }
  if (now >= Date.parse(ticket.accessEndsAt)) {
    throw demoError(ErrorCode.STREAM_CLOSED, "This screening has ended.", 403);
  }

  const sessionId = crypto.randomUUID();
  const alias = readDemoStore<UserProfile | null>("kc-demo-user", null)?.publicScreenAlias;
  return {
    sessionId,
    playbackId: DEMO_PLAYBACK_ID,
    playbackToken: "",
    drmToken: null,
    drmProtected: false,
    streamUrl: `https://stream.mux.com/${DEMO_PLAYBACK_ID}.m3u8`,
    heartbeatIntervalSeconds: 45,
    leaseSeconds: 90,
    schedule: {
      startTime: ticket.startTime,
      endTime: ticket.endTime,
      hardCutoff: ticket.accessEndsAt,
      serverTime: new Date(now).toISOString(),
    },
    watermark: {
      mode: "SUBTLE",
      userRef: "demo7f3a2c",
      alias: alias ?? null,
      sessionId,
      seed: 482193,
    },
  };
}

export async function heartbeat(ticketId: string): Promise<HeartbeatResponse> {
  const ticket = await getTicket(ticketId);
  await demoDelay(200);
  takeRefusal([ErrorCode.STREAM_SESSION_INVALID, ErrorCode.STREAM_CLOSED]);
  const now = Date.now();
  if (now >= Date.parse(ticket.accessEndsAt)) {
    throw demoError(ErrorCode.STREAM_CLOSED, "This screening has ended.", 403);
  }
  return {
    leaseExpiresInSeconds: 90,
    serverTime: new Date(now).toISOString(),
    hardCutoff: ticket.accessEndsAt,
  };
}

export async function sendLocationCode(): Promise<void> {
  await demoDelay();
  if (!readDemoStore(LOCATION_KEY, false)) {
    throw demoError(ErrorCode.VALIDATION_FAILED, "There is no location waiting for confirmation.");
  }
}

/** Any code confirms, except 000000 (wrong) and 111111 (expired) */
export async function confirmLocation(code: string): Promise<void> {
  await demoDelay();
  if (code === "000000") throw demoError(ErrorCode.OTP_INVALID, "That code is not right.");
  if (code === "111111") throw demoError(ErrorCode.OTP_EXPIRED, "That code has expired.");
  writeDemoStore(LOCATION_KEY, null);
}
