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
  /** The address is confirmed with the emailed code; needed to book (dev 9bc5a9f) */
  emailVerified: z.boolean(),
  /** Sign-in asks for an authenticator code; required for staff */
  twoFactorEnabled: z.boolean(),
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

/**
 * The answer to a password (or an email code) on an account with two-factor sign-in: no tokens
 * and no cookie yet. The challenge works once, for 5 minutes, and lives in memory only
 */
export const twoFactorChallengeSchema = z.object({
  twoFactorRequired: z.literal(true),
  challengeToken: z.string(),
  expiresIn: z.number(),
});
export type TwoFactorChallenge = z.infer<typeof twoFactorChallengeSchema>;

/** POST /auth/login and /auth/verify-email: signed in, or a code still to ask for */
export const signInResultSchema = z.union([twoFactorChallengeSchema, signInSchema]);

/** POST /auth/verify-email/resend: the same answer for any address, by design */
export const emailCodeSentSchema = z.object({
  message: z.string(),
  retryAfterSeconds: z.number(),
});

/** POST /auth/two-factor/setup: what the authenticator app needs, valid 10 minutes */
export const twoFactorSetupSchema = z.object({
  secret: z.string(),
  otpauthUri: z.string(),
  expiresIn: z.number(),
});
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;

/** POST /auth/two-factor/enable: a new session (every other one ended) and the recovery codes */
export const twoFactorEnabledSchema = signInSchema.extend({
  recoveryCodes: z.array(z.string()),
});

/** POST /auth/kyc/send-otp (SendOtpResponseDto): the code is emailed, not texted */
export const identityCodeSchema = z.object({ expiresInSeconds: z.number() });
export type IdentityCode = z.infer<typeof identityCodeSchema>;
