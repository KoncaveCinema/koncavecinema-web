/** koncavecinema-api auth and identity-check shapes, field for field. */

export type UserRole = "VIEWER" | "HOST" | "PRODUCER_ADMIN" | "SUPER_ADMIN";

/** GET /auth/me, and `user` in the sign-in and register responses */
export interface UserProfile {
  id: string;
  email: string;
  publicScreenAlias: string | null;
  isPhoneVerified: boolean;
  role: UserRole;
  createdAt: string;
}

/** POST /auth/login. The refresh token arrives as an HttpOnly cookie. */
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserProfile;
}

/** POST /auth/register: creates the account only; sign in afterwards for a session */
export interface RegisterResponse {
  message: string;
  user: UserProfile;
}

/** POST /auth/kyc/send-otp: the code is emailed, not texted */
export interface SendOtpResponse {
  message: string;
  expiresInSeconds: number;
}

/** POST /auth/kyc/verify-otp */
export interface VerifyKycResponse {
  message: string;
  user: UserProfile;
}

/** POST /auth/change-password: a new access token (and refresh cookie); other devices signed out */
export interface ChangePasswordResponse {
  accessToken: string;
  expiresIn: number;
}
