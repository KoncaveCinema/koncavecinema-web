import { z } from "zod";

/*
 * The auth responses the web app reads, checked against koncavecinema-api's openapi.json
 * (dev, df69c97): only the fields the screens use. Every response is parsed with these before
 * anything reads it, so an unexpected reply fails here instead of in a component.
 */

/**
 * VIEWER: members. PRODUCER: producer partners (no console yet). ADMIN: Koncave staff.
 * SUPER_ADMIN: the client. HOST is unused, kept until the API's cleanup migration.
 */
export const userRoleSchema = z.enum(["VIEWER", "HOST", "PRODUCER", "ADMIN", "SUPER_ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** GET and PATCH /auth/me, and `user` in the sign-in response (UserProfileDto) */
export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  publicScreenAlias: z.string().nullable(),
  isPhoneVerified: z.boolean(),
  role: userRoleSchema,
  createdAt: z.iso.datetime(),
  /** When the screen alias may next change (once every 30 days); null when it may change now */
  aliasChangeableAt: z.iso.datetime().nullable(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

/** POST /auth/change-password (AccessTokenDto); the refresh cookie is renewed alongside */
export const accessTokenSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});

/** POST /auth/login (AuthResponseDto); the refresh token arrives as an HttpOnly cookie */
export const signInSchema = accessTokenSchema.extend({ user: userProfileSchema });

/** POST /auth/kyc/send-otp (SendOtpResponseDto): the code is emailed, not texted */
export const identityCodeSchema = z.object({ expiresInSeconds: z.number() });
export type IdentityCode = z.infer<typeof identityCodeSchema>;
