/** koncavecinema-api playback shapes, field for field (src/stream-security/dto). */

export type WatermarkMode = "SUBTLE" | "STRONG";

/** POST /stream-security/authorize-playback */
export interface PlaybackAuthorization {
  /** This device's playback session: presented again after a reload */
  sessionId: string;
  playbackId: string;
  /** Signed stream token (Mux Player: playback-token) */
  playbackToken: string;
  /** DRM licence token, valid 5 minutes; null without DRM */
  drmToken: string | null;
  drmProtected: boolean;
  streamUrl: string;
  heartbeatIntervalSeconds: number;
  /** The device lease lapses this long after a heartbeat */
  leaseSeconds: number;
  schedule: {
    startTime: string;
    endTime: string;
    /** Playback stops here; the playback token expires at this moment */
    hardCutoff: string;
    serverTime: string;
  };
  /** Null when the film's watermark is off */
  watermark: {
    mode: WatermarkMode;
    /** Short viewer reference, not personal data */
    userRef: string;
    alias: string | null;
    sessionId: string;
    /** Seed for the overlay's drift pattern */
    seed: number;
  } | null;
}

/** POST /stream-security/refresh-drm-token: a new licence token for the device holding the lease */
export interface DrmTokenRefresh {
  drmToken: string;
  expiresAt: string;
}

/** POST /stream-security/heartbeat */
export interface HeartbeatResponse {
  leaseExpiresInSeconds: number;
  serverTime: string;
  hardCutoff: string;
}
