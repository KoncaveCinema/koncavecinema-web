import { z } from "zod";

/*
 * The playback replies the screening room reads, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f): only the fields the room uses.
 */

/** The viewer's mark drawn over the picture; null when the film's watermark is off */
export const watermarkSchema = z.object({
  mode: z.enum(["SUBTLE", "STRONG"]),
  /** Short viewer reference, not personal data */
  userRef: z.string(),
  alias: z.string().nullable(),
  sessionId: z.string(),
  /** Seed for the overlay's drift pattern */
  seed: z.number(),
});
export type Watermark = z.infer<typeof watermarkSchema>;

/** POST /stream-security/authorize-playback */
export const playbackAuthorizationSchema = z.object({
  /** This device's playback session: presented again after a reload */
  sessionId: z.string(),
  playbackId: z.string(),
  /** Signed stream token (Mux Player: playback-token) */
  playbackToken: z.string(),
  /** DRM licence token, valid 5 minutes; null without DRM */
  drmToken: z.string().nullable(),
  drmProtected: z.boolean(),
  heartbeatIntervalSeconds: z.number().positive(),
  schedule: z.object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    /** Playback stops here; the playback token expires at this moment */
    hardCutoff: z.iso.datetime(),
  }),
  watermark: watermarkSchema.nullable(),
});
export type PlaybackAuthorization = z.infer<typeof playbackAuthorizationSchema>;

/** POST /stream-security/heartbeat: the lease renewed (the room only needs the 200) */
export const heartbeatSchema = z.object({
  leaseExpiresInSeconds: z.number(),
});

/** POST /stream-security/refresh-drm-token: a new licence token for the device holding the lease */
export const drmTokenSchema = z.object({
  drmToken: z.string(),
  expiresAt: z.iso.datetime(),
});
export type DrmToken = z.infer<typeof drmTokenSchema>;
