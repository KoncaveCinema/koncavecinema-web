# Sprint 2: Catalogue, Showtimes, Booking and Checkout

## Objective

The full path from finding a film to paying for it:

- Now showing, the showtime schedule, and film pages.
- Choosing a room.
- The one-time identity check for Public halls.
- Snacks.
- Review and pay.

Plus private suite invites.

Every page runs on static data now (`NEXT_PUBLIC_DATA_SOURCE=fixtures`), through the same service
functions the API will back. Types copy the API's DTOs field for field, so connecting the API
changes the data source, not the pages. **The Pay button is shown but inactive** until payments
are connected.

---

## Routes

| Route                                   | Access             | Page                                                                                             | API                                                                                                     |
| :-------------------------------------- | :----------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `/movies`                               | Public, indexed    | Now showing: films playing this week, then "Premiering later"                                    | `GET /movies?upcoming=true&sort=soonest`                                                                |
| `/showtimes`                            | Public, indexed    | The schedule by day, in the viewer's timezone; day (`?date=`) and time-of-day (`?time=`) filters | `GET /showtimes?from=&to=`                                                                              |
| `/movies/[slug]`                        | Public, indexed    | Film page: banner, teaser, details, NFVCB rating and certificate, showtimes by day               | `GET /movies/:slug`                                                                                     |
| `/movies/[slug]/showtimes/[showtimeId]` | Public, noindex    | Choose your room: four tiers with the API's price breakdown (`?room=`)                           | `GET /showtimes/:id/capacity`                                                                           |
| `/sign-in`, `/register`                 | Public, noindex    | Email and password; both return to `?next=`                                                      | `POST /auth/login`, `POST /auth/register`                                                               |
| `/forgot-password`, `/reset-password`   | Public, noindex    | Request a link; set a new password (`?token=`)                                                   | `POST /auth/forgot-password`, `POST /auth/reset-password`                                               |
| `/checkout/[ticketId]`                  | Signed in          | Steps in `?step=`: identity (Public hall only), snacks, review and pay; hold timer throughout    | `POST /tickets/reserve` (before), `POST /auth/kyc/*`, concessions, `POST /payments/checkout/initialize` |
| `/checkout/[ticketId]/confirmation`     | Signed in          | Paystack's return (`?reference=`): verify, the pass, add to calendar, suite invite link          | `GET /payments/verify/:reference`                                                                       |
| `/invite/[code]`                        | Signed in to claim | A suite guest takes a seat; signed-out guests go through sign-in or register and come back       | `POST /tickets/claim-invite`                                                                            |

Routes are `/movies`, not `/films`. That matches the API.

The account area (a dashboard with tickets) was removed for now and will be designed as its own
module. There is no public tickets page. `/account`, `/checkout`, `/invite` and the auth pages are disallowed in
`robots.ts`.

**Navigation:** Now showing, Showtimes, How it works, For filmmakers, and on the right either Sign
in or the account menu (Sign out).

---

## Checklist

### 1. Catalogue and film pages

- [x] Now showing grid of portrait posters with live status, the price a buyer pays, and the next
      showtime.
- [x] "Premiering later" grouping (a week after the earliest showtime; the page stays static).
- [x] Schedule page grouped by the viewer's own days, with day and time filters kept in the link.
- [x] Film page with the shared hero stage, teaser, showtimes by day, and details: - Runtime. - NFVCB rating and certificate number. - Producer.
- [x] Every film page in the sitemap; showtime pages noindex.
- [ ] Cast, crew, director and genres: **the API has none of these yet.**

### 2. Choosing a room

- [x] The four tiers from `GET /showtimes/:id/capacity`, each card showing: - `tierName` and `description`. - `seatCount`. - An "Identity check" flag when `requiresKyc` is true. - `pricing.totalPayable`, with the breakdown expandable.
- [x] Prices come only from the API's `PricingBreakdown`. The fields are `basePrice`,
      `seatCount`, `baseAmount`, `infrastructureMarkup`, `subtotal`, `vatPercent`, `vatAmount`,
      `processingFee` and `totalPayable`. There is no `customerTotal`, and no hard-coded tier
      prices.
- [x] Signed out: go to sign-in with the chosen room in `?next=`, then come back to it.
- [x] Signed in: `POST /tickets/reserve` with an `Idempotency-Key`, one per attempt.
- [x] Errors handled by `code`, never by message: - `SCREENING_SOLD_OUT` - `SCREENING_CONCLUDED` - `RESERVATION_ALREADY_HELD` - `RESERVATION_IN_PROGRESS` - `KYC_REQUIRED`

### 3. Accounts

- [x] Registration: email and password only, with **no email verification step**. - Password rules: 8–100 characters, an uppercase and a lowercase letter, and a number or
      symbol, shown as a live checklist. - Terms consent sends `acceptedTermsVersion` (the legal pages' "last updated" date).
- [x] Sign-in: the access token stays in memory only; the session is restored through the API's
      HttpOnly `refresh_token` cookie (`POST /auth/refresh`).
- [x] Password reset: - `/forgot-password` always reports success. - `/reset-password?token=` handles `PASSWORD_RESET_TOKEN_INVALID` with "request a new link".

### 4. Identity check (Public halls only, once per account)

- [x] A checkout step labelled "Verify your identity", skipped when the account's
      `isPhoneVerified` is already true.
- [x] `POST /auth/kyc/send-otp { phoneNumber }` (080… or +234…). The code is **emailed**.
- [x] `POST /auth/kyc/verify-otp { otp, legalFullName, publicScreenAlias }`.
- [x] Handles `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `ALIAS_TAKEN`,
      `PHONE_ALREADY_LINKED` and `KYC_ALREADY_VERIFIED`.
- [x] The NDPA note: no NIN or BVN; phone kept as a hash, legal name encrypted, only the alias
      shown.

### 5. Snacks (optional)

- [x] Menu, quantities, delivery address check, and the rider's phone number.
- [x] Closes 50 minutes before the start (the dispatch cut-off).
- [x] Amounts come from a quote, never added up in the browser.
- [x] The basket is kept for the browser tab only.
- [ ] **Backend:** the concessions endpoints (below).

### 6. Review, pay and confirmation

- [x] Hold timer driven by the API's `lockExpiresAt`, never page-load time. - When the hold expires, the page explains that nothing was charged and offers to choose
      again. - "Cancel and release my seat" calls `DELETE /tickets/release`.
- [ ] Pay, when payments are connected: - `POST /payments/checkout/initialize { ticketId, callbackUrl }`, where `callbackUrl` is
      `/checkout/[ticketId]/confirmation`. - Then redirect to `authorizationUrl`.
- [x] Confirmation: `GET /payments/verify/:reference`, polled every 3 seconds for 30 seconds,
      then shows a message with the support email and the reference. - The pass (`PASS-000001`), add to calendar, and for suites the invite link built from
      `roomInviteCode`.
- [x] Suite guests claim at `/invite/[code]` and get `SUITE_FULL`, `SUITE_NOT_ACTIVE` and
      `SUITE_CLAIM_IN_PROGRESS` messages.

### 7. Demo mode (`NEXT_PUBLIC_DATA_SOURCE=fixtures`)

- Any email and password sign in. The demo profile, never a token, is kept for the browser tab.
- Identity check: any 6-digit code works except `000000`; the alias `taken` is in use.
- The reset token `expired` shows the expired-link state.
- Holds, passes and suite invites are kept for the browser tab.
- The review step links to a preview of the confirmation page.

---

## Backend endpoints this sprint relies on

Agreed with the API team; static data is built to these shapes.

1. `GET /movies` keeps returning all published films by default, with optional filters:
   - `upcoming=true`.
   - `from`/`to` (ISO, at most 31 days apart).
   - `sort=newest|soonest`.

   Each item gains `nextShowtimeAt` (ISO or null).

2. `GET /showtimes?from=&to=&movieSlug=&page=&pageSize=` (public). Each item:
   - `id`, `startTime`, `endTime`, `isLive`, `currency`.
   - `priceFrom`: the Individual tier's `totalPayable`.
   - `movie`: `slug`, `title`, `ageRating`, `durationMinutes`, `posterPortrait`,
     `posterLandscape`.
3. `GET /showtimes/:id` renames `customerTotal` to `totalPayable`.
4. `POST /auth/forgot-password { email }` and `POST /auth/reset-password { token, newPassword }`:
   - The token works for 30 minutes and once only.
   - A reset ends every sign-in.
5. Registration stores `acceptedTermsVersion` and the time it was accepted.

## Still needed from the backend

- **Concessions:**
  - `GET /concessions/catalog`.
  - `POST /concessions/validate-address`, returning serviceability and the delivery fee.
  - A quote, and `POST /concessions/orders`.
  - Shapes in `src/features/concessions/api-types.ts`.
- **Concessions on checkout:** `POST /payments/checkout/initialize` takes only a `ticketId`, so
  snacks can't be paid for in the same charge yet.
- **The hold on reload:** `GET /tickets/:id` doesn't return the hold's price breakdown, its
  `lockExpiresAt` or the film slug. Checkout can't be rebuilt after a reload with the API
  connected.
- **An invite preview:** a public summary of an invite code (film, time, host) for the invite page
  before claiming.
- **Film credits:** cast, director and genres, if wanted on film pages.

---

## Changes after the API review (2026-10-28)

- **Identity before the hold.** `POST /tickets/reserve` refuses a Public Hall seat with 403
  `KYC_REQUIRED` until the member is verified, so an unverified member verifies on the room page
  first; the 10-minute hold starts afterwards. Checkout shows the identity step as done.
- **Snacks only in demo mode** until the API's concessions endpoints (Phase 7). With the API
  connected the snacks step, review row and summary lines are hidden.
- **No email promises** until the API sends a booking confirmation email.
- **Hold timer on server time:** every envelope's `timestamp` sets the device-to-server offset.
- **Confirmation states:** pending after 30 s ("If you closed the payment window, nothing was
  charged"), failed (try again only while the hold is live), not found vs network error, and a
  payment that arrived after the hold expired (refund, `outcome: REFUND_PENDING`).
- **`RESERVATION_ALREADY_HELD`** offers "Continue your booking" (the error's `ticketId`, else the
  member's RESERVED ticket from `GET /tickets/my-tickets`).
- **Registration** creates the account only; the app signs in straight after.
- **Password reset** treats a malformed token as an expired link, ends the local session and
  sends the person to sign-in with a notice. Forgot-password handles `RATE_LIMITED`.
- **Schedule:** `/showtimes` reads `GET /showtimes?from=&to=` (Lagos days, today plus 13) with
  the API connected.
- **The booking pages** (room, checkout, confirmation, invite) use an enclosed layout with no site
  navigation. The account area is removed for now and comes back as a dashboard with its own
  layout.
- **Coming from the backend** and already typed: `GET /tickets/:id` with `pricing`,
  `lockExpiresAt`, `movieSlug`, `posterLandscape`, `lobbyOpensAt` and the suite fields; verify's
  `outcome` and `ticketStatus`; `GET /tickets/invite/:code`.
