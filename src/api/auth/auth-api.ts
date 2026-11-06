import { setAccessToken } from "../access-token";
import { refreshAccessToken } from "../client";
import { http } from "../http";
import {
  accessTokenSchema,
  identityCodeSchema,
  signInSchema,
  userProfileSchema,
  type IdentityCode,
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

/** On page load: the refresh cookie gives an access token, then the profile. Null when signed out. */
export async function restoreSession(): Promise<UserProfile | null> {
  const token = await refreshAccessToken();
  return token ? getProfile() : null;
}

/** POST /auth/login */
export async function signIn(email: string, password: string): Promise<UserProfile> {
  const session = signInSchema.parse(
    await http({ url: "/auth/login", method: "POST", data: { email, password } }),
  );
  setAccessToken(session.accessToken);
  return session.user;
}

/** POST /auth/register creates the account only (no session), so it signs in right after. */
export async function register(
  email: string,
  password: string,
  acceptedTermsVersion: string,
): Promise<UserProfile> {
  await http({
    url: "/auth/register",
    method: "POST",
    data: { email, password, acceptedTermsVersion },
  });
  return signIn(email, password);
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
 * POST /auth/kyc/verify-otp: step 2. Its reply carries only part of the profile, so the full
 * profile is read again afterwards.
 */
export async function verifyIdentity(values: {
  otp: string;
  legalFullName: string;
  publicScreenAlias: string;
}): Promise<UserProfile> {
  await http({ url: "/auth/kyc/verify-otp", method: "POST", data: values });
  return getProfile();
}

/**
 * PATCH /auth/me: change the screen alias, once per 30 days (`aliasChangeableAt`; a change too
 * soon is ALIAS_CHANGE_TOO_SOON with `details.nextChangeAt`).
 */
export async function updateScreenAlias(publicScreenAlias: string): Promise<UserProfile> {
  return userProfileSchema.parse(
    await http({ url: "/auth/me", method: "PATCH", data: { publicScreenAlias } }),
  );
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
