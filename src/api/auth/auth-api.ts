import { setAccessToken } from "../access-token";
import { refreshAccessToken, restoreAccessToken } from "../client";
import { ErrorCode, toApiError } from "../errors";
import { http } from "../http";
import {
  accessTokenSchema,
  emailCodeSentSchema,
  identityCodeSchema,
  signInResultSchema,
  signInSchema,
  twoFactorEnabledSchema,
  twoFactorSetupSchema,
  userProfileSchema,
  type IdentityCode,
  type TwoFactorChallenge,
  type TwoFactorSetup,
  type UserProfile,
} from "./auth-schemas";

/*
 * Auth calls, one function per endpoint (koncavecinema-api docs/api: auth). The forms call these
 * directly: React Hook Form tracks the submit, and the signed-in profile lives in the session
 * store (features/auth/session.ts), not in the query cache, so there are no query hooks here.
 */

/** GET /auth/me */
export async function getProfile(): Promise<UserProfile> {
  return userProfileSchema.parse(await http({ url: "/auth/me" }));
}

/** Waits between page-load tries when the API can't be reached: about 17 seconds in all */
export const RESTORE_RETRY_MS = [2000, 5000, 10_000];

/**
 * On page load: the refresh cookie gives an access token, then the profile. Null when signed
 * out. A dropped connection or a failing server is tried again (the cookie is still good), so a
 * moment offline never signs anyone out; only the API refusing the cookie does.
 */
export async function restoreSession(
  wait: (ms: number) => Promise<void> = (ms) => new Promise((done) => setTimeout(done, ms)),
): Promise<UserProfile | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const token = await restoreAccessToken();
      return token ? await getProfile() : null;
    } catch (error) {
      const apiError = toApiError(error);
      const unreachable = apiError.is(ErrorCode.NETWORK_ERROR) || apiError.status >= 500;
      const delay = RESTORE_RETRY_MS[attempt];
      if (!unreachable || delay === undefined) {
        // Release the requests waiting on a token; the session ends here
        setAccessToken(null);
        throw apiError;
      }
      await wait(delay);
    }
  }
}

/** Signed in (the token is stored), or a two-factor code still to ask for */
export type SignInOutcome =
  { signedIn: true; user: UserProfile } | { signedIn: false; challenge: TwoFactorChallenge };

function signInOutcome(reply: unknown): SignInOutcome {
  const result = signInResultSchema.parse(reply);
  if ("twoFactorRequired" in result) return { signedIn: false, challenge: result };
  setAccessToken(result.accessToken);
  return { signedIn: true, user: result.user };
}

/** POST /auth/login: signed in, or (two-factor sign-in on) a challenge for the code */
export async function signIn(email: string, password: string): Promise<SignInOutcome> {
  return signInOutcome(
    await http({ url: "/auth/login", method: "POST", data: { email, password } }),
  );
}

/**
 * POST /auth/login/two-factor: the second step, with the 6 digits from the authenticator app or
 * a recovery code (case and the dash don't matter). The challenge works once
 */
export async function signInWithCode(challengeToken: string, code: string): Promise<UserProfile> {
  const session = signInSchema.parse(
    await http({ url: "/auth/login/two-factor", method: "POST", data: { challengeToken, code } }),
  );
  setAccessToken(session.accessToken);
  return session.user;
}

/**
 * POST /auth/register creates the account only (no session): the address is confirmed next,
 * with the 6-digit code the API has just emailed, and that signs the member in
 */
export async function register(
  email: string,
  password: string,
  acceptedTermsVersion: string,
): Promise<void> {
  await http({
    url: "/auth/register",
    method: "POST",
    data: { email, password, acceptedTermsVersion },
  });
}

/** POST /auth/verify-email: confirms the address and signs in (or asks for a two-factor code) */
export async function verifyEmail(email: string, code: string): Promise<SignInOutcome> {
  return signInOutcome(
    await http({ url: "/auth/verify-email", method: "POST", data: { email, code } }),
  );
}

/** POST /auth/verify-email/resend: a new code replaces the old; the same answer for any address */
export async function resendEmailCode(email: string) {
  return emailCodeSentSchema.parse(
    await http({ url: "/auth/verify-email/resend", method: "POST", data: { email } }),
  );
}

/** POST /auth/two-factor/setup: the secret for the authenticator app, valid 10 minutes */
export async function beginTwoFactorSetup(): Promise<TwoFactorSetup> {
  return twoFactorSetupSchema.parse(
    await http({ url: "/auth/two-factor/setup", method: "POST", data: {} }),
  );
}

/**
 * POST /auth/two-factor/enable with the app's first code. Every other session of the account
 * ends, this one gets a new token, and the ten recovery codes come back: shown once, never again
 */
export async function enableTwoFactor(code: string) {
  const enabled = twoFactorEnabledSchema.parse(
    await http({ url: "/auth/two-factor/enable", method: "POST", data: { code } }),
  );
  setAccessToken(enabled.accessToken);
  return { user: enabled.user, recoveryCodes: enabled.recoveryCodes };
}

/** POST /auth/two-factor/disable: password and a current (or recovery) code; other sessions end */
export async function disableTwoFactor(password: string, code: string): Promise<UserProfile> {
  const { accessToken } = accessTokenSchema.parse(
    await http({ url: "/auth/two-factor/disable", method: "POST", data: { password, code } }),
  );
  setAccessToken(accessToken);
  return getProfile();
}

/** POST /auth/logout: ends this device's session; the token is dropped even if the call fails */
export async function signOut(): Promise<void> {
  try {
    await http({ url: "/auth/logout", method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

/** POST /auth/forgot-password: always succeeds, whether or not the account exists */
export async function requestPasswordReset(email: string): Promise<void> {
  await http({ url: "/auth/forgot-password", method: "POST", data: { email } });
}

/** POST /auth/reset-password: ends every session of the account, this one included */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await http({ url: "/auth/reset-password", method: "POST", data: { token, newPassword } });
  setAccessToken(null);
}

/** POST /auth/kyc/send-otp: the Public Hall identity check, step 1 (the code is emailed) */
export async function sendIdentityCode(phoneNumber: string): Promise<IdentityCode> {
  return identityCodeSchema.parse(
    await http({ url: "/auth/kyc/send-otp", method: "POST", data: { phoneNumber } }),
  );
}

/**
 * POST /auth/kyc/verify-otp: step 2. The alias is sent only by a member who has none yet (else
 * ALIAS_REQUIRED); one who has an alias keeps it. Its reply carries only part of the profile, so
 * the full profile is read again afterwards.
 */
export async function verifyIdentity(values: {
  otp: string;
  legalFullName: string;
  publicScreenAlias?: string;
}): Promise<UserProfile> {
  await http({ url: "/auth/kyc/verify-otp", method: "POST", data: values });
  return getProfile();
}

/**
 * PATCH /auth/me: set or change the screen alias, for any member. The first one is free; then
 * once per 30 days (`aliasChangeableAt`; a change too soon is ALIAS_CHANGE_TOO_SOON with
 * `details.nextChangeAt`). The access token carries the alias, so it is refreshed afterwards and
 * chat and voice show the new name at once.
 */
export async function updateScreenAlias(publicScreenAlias: string): Promise<UserProfile> {
  const profile = userProfileSchema.parse(
    await http({ url: "/auth/me", method: "PATCH", data: { publicScreenAlias } }),
  );
  await refreshAccessToken();
  return profile;
}

/**
 * POST /auth/change-password: signs every other device out; this one gets a new access token.
 * A wrong current password is INVALID_CREDENTIALS and signs nobody out.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { accessToken } = accessTokenSchema.parse(
    await http({
      url: "/auth/change-password",
      method: "POST",
      data: { currentPassword, newPassword },
    }),
  );
  setAccessToken(accessToken);
}

/**
 * DELETE /auth/me after confirming the password. Refused while the member holds a paid pass for a
 * screening that hasn't ended (ACCOUNT_HAS_UPCOMING_PASSES).
 */
export async function deleteAccount(password: string): Promise<void> {
  await http({ url: "/auth/me", method: "DELETE", data: { password } });
  setAccessToken(null);
}
