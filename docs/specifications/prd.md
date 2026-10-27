# Product Requirements Document (PRD)

**KONCAVE CINEMA APP**  
_Master Product Requirements Document — Version 1.0 (Baseline)_

---

## 1. Product Vision & Measurable SLOs

Koncave Cinema is an enterprise-grade, scheduled-streaming Direct-to-Consumer (D2C) web platform engineered to solve the systemic market failure of contemporary African film distribution. By replicating the physical cinema paradigm in a secure web environment, the platform eliminates exhibitor monopolies and delivers premium premiere events with synchronized viewing, real-time social engagement, and last-mile concession delivery.

### 1.1 Measurable Service Level Objectives (SLOs) & KPIs

| Category                  | Metric                         | Target SLA / Threshold   | Measurement Protocol                                                                    |
| :------------------------ | :----------------------------- | :----------------------- | :-------------------------------------------------------------------------------------- |
| **Content Protection**    | Zero-Day Leak Containment      | 100% Attribution         | Every captured frame must contain a decodable forensic watermark matching User ID & IP. |
| **Streaming Reliability** | Time-To-First-Frame (TTFF)     | < 1.8 seconds            | Measured at showtime unlock across 3G/4G cellular networks.                             |
| **Streaming Continuity**  | Buffer Ratio (Rebuffer / Play) | < 1.5% globally          | Monitored via client-side video telemetry sent to NestJS analytics engine.              |
| **Logistics SLA**         | Pre-Showtime Delivery Window   | 95% within 15–30m window | Webhook reconciliation between Chowdeck Relay API dispatch and showtime start.          |
| **Payment Integrity**     | Webhook Reconciliation Latency | < 2.0 seconds            | Asynchronous signature verification and ticket provisioning speed.                      |
| **Platform Concurrency**  | Showtime Thundering Herd       | 0 HTTP 5xx errors        | Load tested up to 25,000 concurrent socket connections at premiere moment.              |

---

## 2. Scope Boundaries & Phasing

### 2.1 In-Scope for Phase 1 (Web Application MVP)

- Responsive Next.js 15 Progressive Web App (Desktop, Tablet, Mobile Web).
- Multi-tier ticketing engine: Individual (N5,000), Public Hall (N3,000), Private Suite (N30,000 for 5, N60,000 for 10).
- Statutory 3-Point KYC verification engine for Public Hall entrants (Phone OTP + Legal Identity Binding).
- Simulated Live streaming engine with dynamic ABR and local buffer-tolerance offset tracking.
- Multi-DRM pipeline (Widevine L1/L3, FairPlay) and client-side dynamic canvas forensic watermarking.
- Concessions cart integrated with Chowdeck Relay DaaS API for automated 50m pre-show dispatch.
- Multi-modal payment integration: Paystack (NGN/Cards/Bank Transfer/USSD/Apple Pay) and Busha Commerce roadmap (USDT/USDC stablecoins on TRON/Polygon/Solana).
- Real-time text chat (Socket.IO + Redis) and Private Suite WebRTC voice chat (LiveKit Cloud SFU).
- Administrative console for master video ingest, showtime scheduling, and NFVCB compliance certification.

### 2.2 Explicitly Out-of-Scope (Deferred to Phase 2 / Post-MVP)

- **Native Mobile Apps**: Native iOS (Swift/SwiftUI) and Android (Kotlin) apps are deferred to Phase 2.
- **Google & Social OAuth 2.0**: Social federated login is scheduled for Phase 2 roadmap to maintain laser focus on core email/password credentials and direct ticket token passes in Phase 1 MVP.
- **Smart TV Apps**: Apple TV, Android TV, Samsung Tizen, and LG WebOS are non-goals for Phase 1.
- **Peer-to-Peer Webcam Video**: Excluded from watch parties due to broadband saturation on mobile cellular networks and legal liabilities under the Cybercrimes Act 2015. Voice chat delivers intimate interaction with a fraction of the bandwidth overhead.
- **Open Producer Marketplace**: Self-service multi-tenant onboarding is locked. Ingest is restricted to the founding producer and curated white-glove partners.

---

## 3. End-to-End System Modules

### 3.1 Module A: Authentication, Access Control & Statutory KYC

- **Standard Authentication**: High-security email/password registration with Argon2id hashing and asymmetric RS256 JWT access tokens paired with HttpOnly refresh cookies.
- **Unified In-Checkout Registration & Statutory KYC Flow**:
  To eliminate drop-off and eliminate chat-locking surprises inside the screening room, identity and KYC verification are integrated directly into the 3-step ticket purchase modal for **Public Theatres (Communal Halls)**:

```txt
┌────────────────────────────────────────────────────────────────────────┐
│                   IN-CHECKOUT IDENTITY & KYC MODAL                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🎬 Public Theatre (Communal Hall) — N5,000                            │
│  Perks: Full Movie Premiere + Live Communal Chat + Concession Delivery │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 1: YOUR DETAILS (Auto-Registers / Logs In)                  │  │
│  │   Email:      [ user@example.com                    ]            │  │
│  │   Password:   [ ••••••••••••••••                    ]            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 2: CHAT IDENTITY & STATUTORY KYC                            │  │
│  │   "Public halls feature live communal chat. To keep the hall     │  │
│  │    safe & verified, confirm your phone number and screen alias." │  │
│  │                                                                  │  │
│  │   Phone:         [ +234 801 234 5678 ] -> [ Send Code ]          │  │
│  │   6-digit OTP:   [ 8 4 9 2 0 1       ]                           │  │
│  │   Full Name:     [ Micheal Osunbajo  ] (Hidden/Encrypted)        │  │
│  │   Screen Alias:  [ CinemaKing_99     ] (Shown in Live Chat)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ STEP 3: PAYMENT GATEWAY (Paystack / Busha Commerce)              │  │
│  │   Total: N5,177.67 (Ticket: N5,000 + Processing Fee: N177.67)     │  │
│  │   [ PAY NOW N5,177.67 ] ───────────► Opens Checkout Popup        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Frontend Sequential API Invocation Contract

1. **Account Creation / Login**: If unauthenticated, frontend calls `POST /api/auth/register` (or `POST /api/auth/login`) receiving the Bearer access token in memory.
2. **OTP Dispatch**: Frontend calls `POST /api/auth/kyc/send-otp` with the phone number and user credentials. Resend dispatches 6-digit cryptographic verification code to the user's registered email.
3. **Identity Binding**: User enters OTP, legal full name, and unique alias. Frontend calls `POST /api/auth/kyc/verify-otp`. Backend commits HMAC-SHA256 phone hash, legal name, and binds alias (`isPhoneVerified: true`).
4. **Seat Lock & Checkout**: Frontend calls `POST /api/tickets/reserve` to acquire Redis lock (`SETNX`), then initializes payment gateway.
5. **Premiere Admission**: On premiere night, user clicks their ticket link and gains **instant, frictionless entry to both movie and live communal chat** with zero popups or interruptions.

### 3.2 Module B: Dynamic Ticketing & Direct Access Engine

- **Auditorium Seat Reservation**: Seat reservation triggers an atomic Redis lock (`SET lock:seat:{showtime_id}:{seat_id} {user_id} NX EX 600`) with a 10-minute hold window.
- **Ticket Token Digital Pass**: Upon successful payment, a cryptographically signed ticket token (`streamJwtToken`) is issued and emailed to the user as a magic watch link (`/watch/room_xyz?ticket=TKT_TOKEN`).
- **Direct Cinema Entry (`POST /api/tickets/verify-access`)**:
  - Allows immediate room entry using the ticket token without re-entering passwords.
  - Returns current auditorium state, DRM playback manifests (at showtime), LiveKit voice tokens, and chat credentials.
  - Automatically transitions users to the **Pre-Showtime Waiting Lobby** if accessed prior to showtime.

### 3.3 Module C: Concessions E-Commerce & JIT Logistics

- Concession catalog: Regular Popcorn (N2,000), Large Popcorn (N3,500), Nachos (N2,500), Soft Drinks (N1,500), Bottled Water (N1,000).
- Google Places API geocoding cross-references delivery address with active Chowdeck concession hubs (Lekki, Ikeja, Surulere, Victoria Island).
- BullMQ delayed queue triggers dispatch order targeting Chowdeck Relay DaaS API (`POST /v1/merchant/delivery`) **T-minus 50 minutes** prior to showtime.
- Couriers deliver concessions **15 to 30 minutes before opening credits**.

### 3.4 Module D: The 'Simulated Live' Streaming Engine & Buffer Tolerance

- Scheduled Manifest Authorization: Playback manifest locked until scheduled premiere second.
- Adaptive Bitrate Ladder (H.264 / AAC):
  - 1080p Full HD: 3,500 kbps
  - 720p HD: 1,800 kbps
  - 480p SD: 800 kbps
  - 360p Mobile: 400 kbps
- **Buffer-Tolerance Offset Model**: If a user experiences cellular packet loss, the player pauses locally and buffers rather than skipping forward:
  $$t_{local} = t_{server} - \Delta_{buffer}$$
- Maximum permitted drift is 15 minutes before the session hard-expires post-movie. Chat includes a "Mute Spoilers" toggle for buffered viewers.

### 3.5 Module E: Security, Anti-Piracy & VIP Suite Host Admission

- Hardware & Software Multi-DRM (Widevine L1/L3, FairPlay, PlayReady).
- Dynamic Forensic Canvas Watermarking with Brownian motion (`UID`, `IP`, `Timestamp`).
- Streams served only against RS256-signed playback tokens, with 5-minute DRM license tokens.
- **VIP Private Suite Host "Knock-to-Enter" Admission Protocol**:
  - The purchasing host receives 1 Host Pass + 4 (or 9) Guest invite links.
  - When an invited guest enters the room, they enter a private waiting room.
  - The Host receives a real-time WebSocket prompt (`host:admission_request`) displaying the guest's name/alias to explicitly **[Admit]** or **[Deny]** entry, preventing unauthorized leak access.
- Geo-Velocity impossible travel detection (>900 km/h) triggering phone re-verification.
- DRM Secure Stop protocol using `navigator.sendBeacon` upon tab closure.

### 3.6 Module F: Cinema Hall Social Communications & Waiting Lobby

- **Pre-Showtime Waiting Lobby & Live Countdown**:
  - Users clicking ticket links prior to showtime arrive at the atmospheric waiting room showing movie backdrop, synchronized countdown clock, and concession delivery ETA.
  - At $T-0$, the screen automatically transitions seamlessly into the live cinema stream without requiring a page refresh.
- **Public Theatres**: Socket.IO text chat with Redis Pub/Sub adapter. Server-side rate limiting (max 1 message per 3 seconds per user), profanity filter, URL blocking.
- **Private Suites**: LiveKit Cloud WebRTC voice mesh. Audio-only Opus voice codec (16 kbps mono) with echo cancellation. Host moderation dashboard (Mute Individual, Mute All, Knock Admission, Revoke Invite, Sync Pause).

### 3.7 Module G: Multi-Modal Payment Gateways

- **Paystack (Primary Active Gateway)**: Domestic & diaspora cards (NGN, USD, GBP, EUR), Bank Transfers, USSD, and Apple Pay. HMAC-SHA512 webhook reconciliation.
- **Busha Commerce (Future Stablecoin Gateway Roadmap)**: Non-volatile USD-pegged stablecoins (USDT and USDC) across TRON, Polygon, and Solana. Shared secret webhook verification with zero volatile asset exposure.

### 3.8 Module H: Producer Admin Management & Compliance

- Master video ingest (mezzanine H.264 / HEVC) by direct upload to Mux Video.
- NFVCB statutory certificate number and document verification upload gate.
- Real-time box office telemetry: gross admissions, tier breakdown, F&B revenue, concurrent streams.

---

## 4. System State Machines

### 4.1 Showtime & Stream Unlock Lifecycle

1. `ANNOUNCED / PRE-SALE`: Tickets and concessions purchasable. Stream locked on CDN.
2. `PRE-SHOW LOBBY` (T-minus 30m): Ticket holders enter virtual lobby; live countdown timer active.
3. `PRE-FETCH BUFFER` (T-minus 90s): Client player pre-buffers first 3 HLS segments into memory at Frame Zero.
4. `LIVE SCREENING` (T-zero): Synchronized unlock command emitted; video plays from memory; watermark activates.
5. `DRIFT TOLERANCE EXPIRY` (T + Movie Duration + 15m): Stream tokens revoked globally; chat transitions to read-only.
6. `ARCHIVED / COMPLETED`: Showtime closed; analytics aggregated to Producer dashboard.

### 4.2 Concession Delivery Lifecycle

- `ORDER_PLACED` -> Stored in database; BullMQ delayed job registered.
- `DISPATCH_QUEUED` (T-minus 50m) -> Job wakes; calls Chowdeck Relay API.
- `COURIER_ASSIGNED` -> Chowdeck webhook assigns courier; maps live location.
- `PICKED_UP` (T-minus 35m) -> Courier collects concessions from partner hub.
- `DELIVERED` (T-minus 15–30m) -> Food delivered; webhook marks order complete.
- `EXCEPTION / DELAYED` -> If unfulfilled by T-minus 10m, SMS alert and automated wallet credit voucher issued.

---

## 5. Operational Edge Cases & Fallback Protocols

| Scenario                     | Trigger                                             | System Impact                            | Automated Fallback Protocol                                                                                  |
| :--------------------------- | :-------------------------------------------------- | :--------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Thundering Herd**          | 10,000+ users pinging API at exact showtime.        | Database connection pool exhaustion.     | Manifests served 100% from CDN edge cache. Client buffers 90s early.                                         |
| **Concession Rider Delay**   | Courier delayed by Lagos traffic past movie start.  | Patron watching movie without food.      | Webhook detects delay; issues instant concession refund voucher + 20% discount on next ticket.               |
| **Packet Loss / Cell Stall** | Cellular connection drops for 5 minutes.            | Player stalls behind master schedule.    | Buffer drift engine allows viewing up to 15m post-credits. Chat has "Mute Spoilers" button.                  |
| **Credential Sharing**       | User shares login credentials with third-party.     | Multiple streams on one paid ticket.     | Redis session monitor detects second active connection on ticket ID; revokes first session immediately.      |
| **DRM Failure**              | Outdated browser lacking Widevine CDM.              | Video decryption fails (black screen).   | EME failure detected; displays modal prompting user to switch to Chrome/Edge/Safari.                         |
| **Webhook Drop**             | Payment gateway webhook lost due to network glitch. | User charged but ticket remains PENDING. | Client polls `GET /payments/verify/{ref}` every 3s for 30s. Background cron queries gateway directly at 60s. |

---

## 6. Release Gateways & Quality Assurance Sign-Off

1. **Gate 1: DRM Integrity**: Verified zero screen recording leaks on Safari (macOS/iOS), Edge (Windows), and Chrome (Android/Windows).
2. **Gate 2: Load Simulation**: Locust load test simulating 25,000 concurrent socket connections and 5,000 concurrent video streams with zero 5xx server errors.
3. **Gate 3: Logistics End-to-End**: Simulated Chowdeck Relay API sandbox dispatch completing successfully with mocked courier arrival within 15–30m window.
4. **Gate 4: Multi-Channel Checkout**: Live test transactions completed via Paystack (Naira Card, Bank Transfer, USSD) with webhook idempotency and seat release verification.
5. **Gate 5: Compliance Certification**: Legal verification of producer TVOD licensing agreement and valid NFVCB classification certificate attached to premiere title.
