# Sprint 2: Interactive Catalog, Showtime Booking & In-Checkout KYC

## Objective

Deliver the complete browsing, scheduling, and ticket acquisition pipeline. Introduce film discovery with NFVCB regulatory compliance, the 4-tier screening selection modal, Chowdeck Relay concessions tray, and the statutory 3-point KYC verification gate integrated strictly during Public Theatre ticket checkout.

---

## Actionable Execution Checklist

### 1. Film Catalog & Discovery UI

- [ ] **Curated Catalog Grid** (`/films` or updated home catalog):
  - [ ] Tabbed view: "Now Showing" (live/upcoming today), "Coming Soon" (premieres this month), and "Festival Selections".
  - [ ] Dynamic genre filtering: Nollywood Drama, Action, Comedy, Epic Folklore, Psychological Thriller, Short Films.
  - [ ] High-impact movie cards with backdrop trailers, synopsis preview, director credit, and premiere countdown timer.
- [ ] **NFVCB Certification Badges**:
  - [ ] Visual age classification badge on every movie card and detail banner:
    - [ ] `G`: General Exhibition
    - [ ] `PG`: Parental Guidance
    - [ ] `12`: Not suitable for children under 12
    - [ ] `15`: Not suitable for persons under 15
    - [ ] `18`: Mature audiences only
  - [ ] Display NFVCB official verification certificate code.
- [ ] **Film Detail Page** (`/films/[slug]`):
  - [ ] High-definition cinematic banner with embedded trailer modal.
  - [ ] Cast and crew credits, synopsis, theatrical release year, runtime, and audio specification.
  - [ ] Synchronized showtimes calendar (Today, Tomorrow, Weekend Premieres).

### 2. Four-Tier Ticket Selection Modal

- [ ] Design interactive tier selection modal triggered on selecting a showtime:
  - [ ] **Tier A - Individual Watch (₦5,000)**:
    - [ ] Highlight: Distraction-free, solo cinema immersion, zero chat notifications.
    - [ ] Flag: **Zero KYC required**. Direct to checkout.
  - [ ] **Tier B - Public Theatre (₦5,000 / seat)**:
    - [ ] Highlight: Communal screening with up to 1,000 viewers, live emoji reactions, moderated chat.
    - [ ] Flag: **Requires Statutory 3-Point KYC** (proceeds to in-checkout verification step).
  - [ ] **Tier C - Private Suite 5 (₦30,000 / room)**:
    - [ ] Highlight: Exclusive room for up to 5 friends with LiveKit WebRTC spatial voice lounge.
    - [ ] Includes host invitation link generation.
  - [ ] **Tier D - Private Suite 10 (₦60,000 / room)**:
    - [ ] Highlight: VIP auditorium for up to 10 friends with voice lounge and custom host permissions.

### 3. In-Checkout Statutory 3-Point KYC Engine (Public Theatres Only)

- [ ] Implement `src/features/checkout/components/kyc-verification-modal.tsx`:
  - [ ] Triggered exclusively when Tier B (Public Theatre) is selected.
  - [ ] NDPA 2023 Proportionality statement: Explaining why NIN/BVN are not required, and how phone hashing protects privacy.
  - [ ] **Stage 1 - Mobile Verification**:
    - [ ] Nigerian telephone input (+234 format validation).
    - [ ] Dispatch OTP via backend `POST /api/auth/kyc/send-otp`.
  - [ ] **Stage 2 - Cryptographic Verification & Alias Binding**:
    - [ ] 6-digit OTP entry field with auto-focus and countdown resend timer.
    - [ ] Legal Full Name input (encrypted AES-256-GCM on backend).
    - [ ] Public Chat Alias input (real-time availability check, profanity filter).
    - [ ] Submit verification via `POST /api/auth/kyc/verify-otp`.
  - [ ] Smooth transition to payment once verified, caching verified status in secure session state.

### 4. Chowdeck Relay Concessions Tray (DaaS Integration)

- [ ] Implement `src/features/concessions/components/concessions-tray.tsx`:
  - [ ] Interactive snack menu: Fresh Gourmet Popcorn (Caramel, Salty, Butter), Chilled Drinks, Finger Foods.
  - [ ] Delivery address input with geocoding verification (Lagos, Abuja, Port Harcourt coverage).
  - [ ] Just-in-Time (JIT) dispatch schedule indicator: Snacks arrive 15–30 minutes before film showtime (dispatch cut-off at T-50m).
  - [ ] Itemized concession subtotal added to checkout summary.

### 5. Paystack Pass-Through Checkout

- [ ] Implement `src/features/checkout/components/paystack-checkout.tsx`:
  - [ ] Transparent pass-through fee itemization:
    - Base ticket price (₦5,000 or suite price).
    - Concessions total (if added).
    - Processing gateway fee (1.5% + ₦100, capped at ₦2,000).
    - Total gross payable.
  - [ ] Integration with Paystack inline checkout popup.
  - [ ] Post-payment confirmation receipt with digital ticket pass, calendar invite (.ics), and direct link to the Auditorium Lobby.
