import { api, ApiError, ErrorCode, refreshAccessToken, setAccessToken } from "@/lib/api";
import { demoDelay, demoError, isDemo, readDemoStore, writeDemoStore } from "@/lib/demo";

import type {
  AuthResponse,
  ChangePasswordResponse,
  RegisterResponse,
  SendOtpResponse,
  UserProfile,
  VerifyKycResponse,
} from "./api-types";
import { demoRoleFor } from "./roles";
import type { VerifyIdentityValues } from "./schemas";

/*
 * Auth calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo stands in
 * for the API: any well-formed details sign in, and the demo profile (never a token) is kept for
 * this browser tab so a reload stays signed in, as the API's refresh cookie would. Demo triggers
 * for the error states are listed in DEMO_HINTS.
 */

const DEMO_USER_KEY = "kc-demo-user";

/** Shown under the forms in demo mode, so reviewers can reach every state */
export const DEMO_HINTS = {
  signIn:
    "Demo: any email and password sign in. admin@… signs in as the super admin, staff@… as staff.",
  otp: "Demo: any 6-digit code works, except 000000 (wrong code).",
  alias: "Demo: the alias “taken” is already in use.",
  reset: "Demo: the link token “expired” shows the expired-link state.",
  aliasChange: "Demo: the alias “taken” is in use, and a second change within 30 days is refused.",
  password: "Demo: the current password “wrong” is refused.",
  deleteAccount:
    "Demo: the password “wrong” is refused, and “upcoming” shows the refusal for upcoming passes.",
};

const ALIAS_CHANGED_KEY = "kc-demo-alias-changed";
const ALIAS_COOLDOWN_MS = 30 * 24 * 60 * 60_000;

const readDemoUser = () => readDemoStore<UserProfile | null>(DEMO_USER_KEY, null);

/** Demo only: whether the demo account has passed the Public Hall identity check */
export function demoUserIsVerified(): boolean {
  return readDemoUser()?.isPhoneVerified === true;
}

const writeDemoUser = (user: UserProfile | null) => writeDemoStore(DEMO_USER_KEY, user);

function demoUser(email: string): UserProfile {
  return {
    id: "demo-user",
    email,
    publicScreenAlias: null,
    isPhoneVerified: false,
    role: demoRoleFor(email),
    createdAt: new Date().toISOString(),
  };
}

/** Restores the session on page load: the refresh cookie, then the profile. */
export async function restoreSession(): Promise<UserProfile | null> {
  if (isDemo) return readDemoUser();
  const token = await refreshAccessToken();
  if (!token) return null;
  return api.get<UserProfile>("/auth/me");
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (isDemo) {
    await demoDelay();
    const user = readDemoUser()?.email === email ? readDemoUser()! : demoUser(email);
    writeDemoUser(user);
    return user;
  }
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  setAccessToken(response.accessToken);
  return response.user;
}

export async function register(
  email: string,
  password: string,
  acceptedTermsVersion: string,
): Promise<UserProfile> {
  if (isDemo) {
    await demoDelay();
    const user = demoUser(email);
    writeDemoUser(user);
    return user;
  }
  // Registration creates the account only (no token, no refresh cookie): sign in right after
  await api.post<RegisterResponse>("/auth/register", { email, password, acceptedTermsVersion });
  return signIn(email, password);
}

export async function signOut(): Promise<void> {
  if (isDemo) {
    writeDemoUser(null);
    return;
  }
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

/** Always succeeds, whether or not the account exists (the API never reveals it). */
export async function requestPasswordReset(email: string): Promise<void> {
  if (isDemo) {
    await demoDelay();
    return;
  }
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (isDemo) {
    await demoDelay();
    if (token === "expired") {
      throw demoError(ErrorCode.PASSWORD_RESET_TOKEN_INVALID, "This link has expired.");
    }
    writeDemoUser(null);
    return;
  }
  await api.post("/auth/reset-password", { token, newPassword });
  // A reset ends every session of the account, this one included
  setAccessToken(null);
}

/** Public Hall identity check, step 1: the code is emailed to the account's address. */
export async function sendIdentityCode(phoneNumber: string): Promise<SendOtpResponse> {
  if (isDemo) {
    await demoDelay();
    return { message: "Verification code sent.", expiresInSeconds: 300 };
  }
  return api.post<SendOtpResponse>("/auth/kyc/send-otp", { phoneNumber });
}

/** Public Hall identity check, step 2. Returns the updated profile. */
export async function verifyIdentity(values: VerifyIdentityValues): Promise<UserProfile> {
  if (isDemo) {
    await demoDelay();
    if (values.otp === "000000") throw demoError(ErrorCode.OTP_INVALID, "That code is not right.");
    if (values.publicScreenAlias.toLowerCase() === "taken") {
      throw demoError(ErrorCode.ALIAS_TAKEN, "That alias is taken.", 409);
    }
    const current = readDemoUser() ?? demoUser("guest@example.com");
    const user = {
      ...current,
      isPhoneVerified: true,
      publicScreenAlias: values.publicScreenAlias,
    };
    writeDemoUser(user);
    return user;
  }
  const response = await api.post<VerifyKycResponse>("/auth/kyc/verify-otp", values);
  return response.user;
}

/* Account settings (the dashboard) */

/**
 * PATCH /auth/me: change the screen alias. Members who passed the Public Hall check only; once per
 * 30 days (ALIAS_CHANGE_TOO_SOON carries `details.nextChangeAt`). Returns the updated profile.
 */
export async function updateScreenAlias(publicScreenAlias: string): Promise<UserProfile> {
  if (isDemo) {
    await demoDelay();
    const current = readDemoUser();
    if (!current?.isPhoneVerified) {
      throw demoError(ErrorCode.KYC_REQUIRED, "Verify your identity first.", 403);
    }
    if (current.publicScreenAlias === publicScreenAlias) return current;
    // As the API: once per 30 days, counted from the last change (not the first choice)
    const changedAt = readDemoStore(ALIAS_CHANGED_KEY, 0);
    const nextChangeAt = changedAt + ALIAS_COOLDOWN_MS;
    if (changedAt && nextChangeAt > Date.now()) {
      throw new ApiError({
        status: 409,
        code: ErrorCode.ALIAS_CHANGE_TOO_SOON,
        messages: ["Your screen alias can change once every 30 days."],
        details: { nextChangeAt: new Date(nextChangeAt).toISOString() },
      });
    }
    if (publicScreenAlias.toLowerCase() === "taken") {
      throw demoError(ErrorCode.ALIAS_TAKEN, "That alias is taken.", 409);
    }
    const user = { ...current, publicScreenAlias };
    writeDemoUser(user);
    writeDemoStore(ALIAS_CHANGED_KEY, Date.now());
    return user;
  }
  return api.patch<UserProfile>("/auth/me", { publicScreenAlias });
}

/**
 * POST /auth/change-password. Signs every other device out; this one gets a new access token (and
 * refresh cookie). A wrong current password is INVALID_CREDENTIALS and does not sign out.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (isDemo) {
    await demoDelay();
    if (currentPassword === "wrong") {
      throw demoError(ErrorCode.INVALID_CREDENTIALS, "That isn't your current password.", 401);
    }
    return;
  }
  const response = await api.post<ChangePasswordResponse>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  setAccessToken(response.accessToken);
}

/**
 * DELETE /auth/me: delete the account after confirming the password. Refused while the member
 * holds a paid pass for a screening that hasn't ended (ACCOUNT_HAS_UPCOMING_PASSES).
 */
export async function deleteAccount(password: string): Promise<void> {
  if (isDemo) {
    await demoDelay();
    if (password === "wrong") {
      throw demoError(ErrorCode.INVALID_CREDENTIALS, "That password isn't right.", 401);
    }
    if (readDemoUser()?.role !== "VIEWER") {
      throw demoError(
        ErrorCode.FORBIDDEN,
        "Staff and producer accounts are closed through support, not self-service.",
        403,
      );
    }
    if (password === "upcoming") {
      throw new ApiError({
        status: 409,
        code: ErrorCode.ACCOUNT_HAS_UPCOMING_PASSES,
        messages: ["You have a paid pass for a screening that has not ended."],
        details: { upcomingPasses: 2 },
      });
    }
    writeDemoUser(null);
    return;
  }
  await api.delete("/auth/me", { data: { password } });
  setAccessToken(null);
}
