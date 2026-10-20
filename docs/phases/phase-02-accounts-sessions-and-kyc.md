# Phase F2: Accounts, Sessions & KYC

## Objective

Sign-up, sign-in and a durable session against the API's RS256 tokens, plus the reusable phone
KYC step that Public Hall checkout needs.

## API Endpoints

| Method | Endpoint                   | Use                                                   |
| :----- | :------------------------- | :---------------------------------------------------- |
| `POST` | `/api/auth/register`       | Create account (does not sign in; follow with login)  |
| `POST` | `/api/auth/login`          | Access token in body; refresh cookie set by the API   |
| `POST` | `/api/auth/refresh`        | Bootstrap on page load and recover from `401`         |
| `POST` | `/api/auth/logout`         | Revoke session, clear cookie                          |
| `GET`  | `/api/auth/me`             | Profile: email, alias, `isPhoneVerified`, role        |
| `POST` | `/api/auth/kyc/send-otp`   | Send code (3 per 15 minutes)                          |
| `POST` | `/api/auth/kyc/verify-otp` | Code, legal name (never shown again) and public alias |

## Deliverables

- Session store and `useSession()` hook (status: `loading | authenticated | anonymous`), bootstrap
  refresh, sign-out on refresh failure, cross-tab sign-out via `BroadcastChannel`.
- Register and sign-in forms; password rules mirror the API (8–100 characters, upper, lower, and a
  digit or symbol); `INVALID_CREDENTIALS` and `EMAIL_ALREADY_REGISTERED` handled inline.
- Guards for `(account)` and `(studio)` route groups; role gate for `PRODUCER_ADMIN` / `SUPER_ADMIN`.
- `KycStep` component usable standalone and inside checkout: phone (`080…` or `+234…`), resend
  timer, 6-digit OTP input, legal name, alias (3–25 characters, letters, digits, `_`, `-`),
  consent checkbox for chat logging (regulatory section 2.2); errors `OTP_INVALID`,
  `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `ALIAS_TAKEN`, `PHONE_ALREADY_LINKED`,
  `KYC_ALREADY_VERIFIED`.
- Profile page (email, alias, verification status).

## Acceptance Criteria

- [ ] Reloading any page keeps the user signed in without a token in web storage.
- [ ] Ten parallel requests that all get `401` cause exactly one refresh call.
- [ ] The legal name and phone number are never rendered after submission.
