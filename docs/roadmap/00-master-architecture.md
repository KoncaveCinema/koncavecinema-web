# Master Architectural Blueprint: Koncave Cinema Frontend-

## 1. Executive Summary & Vision

Koncave Cinema is a premier digital cinema platform built to solve the catastrophic structural crisis facing the Nollywood film industry. Traditional Nigerian physical cinema chains extract 50% to 60% of gross box office receipts in theatrical rental fees, leaving independent filmmakers unable to recoup production costs.

Koncave fundamentally inverts this economic paradigm:

- **85% to 92% Net Revenue Return** directly to filmmakers and distributors.
- **Synchronized Scheduled Showtimes**: Replicating the urgency, collective emotion, and communal event status of opening-night theatrical releases, rather than passive on-demand catalog browsing.
- **Four Distinct Screening Experiences**: Individual Watch, Public Theatres (up to 1,000 communal viewers), and Private Suites (5 or 10 seats with WebRTC spatial voice).
- **Studio-Grade Anti-Piracy**: Mux Multi-DRM, dynamic Brownian motion forensic canvas watermarking, and single-device concurrency locks.
- **Zero-Friction JIT Concessions**: Seamless integration with Chowdeck Relay DaaS for real-world cinema snacks delivered right to the viewer's door before curtain rise.

---

## 2. Core Architectural Pillars

```txt
+-----------------------------------------------------------------------------------+
|                                 USER EXPERIENCE                                   |
|   Individual Watch (Solo)  |  Public Theatres (Communal)  |  Private Suites (VIP) |
+-----------------------------------------------------------------------------------+
|                                 FRONTEND SHELL                                    |
|   Next.js 15 App Router    |  Tailwind CSS Design Tokens  |  TypeScript Strict    |
+-----------------------------------------------------------------------------------+
|                         IN-CHECKOUT STATUTORY 3-POINT KYC                         |
|   Exclusively for Public Theatres | Phone OTP + Legal Identity Binding + Alias    |
+-----------------------------------------------------------------------------------+
|                             CINEMA & STREAMING ENGINE                             |
|   Synchronized Lobby (T-30m)   |  In-Memory Pre-Buffer (T-90s) | Mux Multi-DRM    |
|   Brownian Motion Watermark    |  LiveKit WebRTC SFU Audio     | 4-Zone Catch-Up  |
|   45s Heartbeat Concurrency    |  sendBeacon Secure Release    | Zero-Tamper DRM  |
+-----------------------------------------------------------------------------------+
|                             ECOSYSTEM INTEGRATIONS                                |
|   Chowdeck Relay Concessions   |  Paystack Pass-Through Fees   | NFVCB Compliance |
+-----------------------------------------------------------------------------------+
```

### 2.1 The Four Cinema Tiers

| Tier                 | Price           | Capacity    | Social Features                                       | KYC Requirement                                   | Concurrency           |
| :------------------- | :-------------- | :---------- | :---------------------------------------------------- | :------------------------------------------------ | :-------------------- |
| **Individual Watch** | ₦5,000 / ticket | 1 viewer    | No social distractions; solo immersive player         | **Zero KYC** (Email only)                         | 1 device strict lock  |
| **Public Theatre**   | ₦5,000 / seat   | Up to 1,000 | High-speed text chat, emoji reactions, spoiler shield | **Statutory 3-Point KYC** (In-checkout phone OTP) | 1 device strict lock  |
| **Private Suite 5**  | ₦30,000 / suite | 5 friends   | Ultra-low-latency WebRTC voice lounge + text chat     | Host reservation; private invite code             | 1 device per attendee |
| **Private Suite 10** | ₦60,000 / suite | 10 friends  | WebRTC voice lounge + VIP host controls               | Host reservation; private invite code             | 1 device per attendee |

---

### 2.2 Statutory 3-Point KYC Protocol (Public Theatres Only)

Under the **Nigeria Data Protection Act (NDPA 2023)** proportionality principle (Section 24), collecting national identity numbers (NIN) or Bank Verification Numbers (BVN) for cinema entertainment is legally non-compliant.

Instead, Koncave implements an **in-checkout 3-point verification modal** triggered strictly when reserving a **Public Theatre** ticket:

1. **Step 1 - Selection**: User chooses film showtime and selects "Public Theatre".
2. **Step 2 - Chat Identity & Verification**:
   - Nigerian mobile number (+234) submitted.
   - 6-digit cryptographic OTP dispatched via Resend to the verified account.
   - User provides legal full name and chooses a unique public chat alias.
   - The phone number is irrevocably hashed on the backend using HMAC-SHA256 with a Pepper key.
3. **Step 3 - Paystack Gateway**: Pass-through checkout.

_Individual Watch and Private Suites completely bypass Step 2, ensuring frictionless checkouts for solo viewers and closed private groups._

---

### 2.3 Studio-Grade Anti-Piracy & DRM Engine

1. **Mux Multi-DRM Pipeline**:
   - Apple FairPlay Streaming (Safari / iOS / macOS).
   - Google Widevine Modular L1/L3 (Chrome / Android).
   - Microsoft PlayReady (Edge / Windows).
2. **Dynamic Brownian Motion Forensic Watermark**:
   - An HTML5 Canvas layer rendered directly over the decrypted video viewport.
   - Renders the viewer's `User ID`, masked `IP Address`, and synchronized `Epoch Timestamp`.
   - Repositions continuously every 3 to 7 seconds using pseudo-random Brownian motion jitter to defeat static algorithmic blurring filters and screen-recording cropping.
   - CSS pointer-events disabled; protected against DOM tree tampering via MutationObserver guards.
3. **Single-Device Concurrency & Leased Sessions**:
   - Redis-backed 45-second heartbeat ping from client to backend.
   - On tab closing, browser navigation, or crash, the client dispatches an immediate termination payload via `navigator.sendBeacon` to release the lease instantly.
   - If an unauthorized concurrent stream is detected, the older session receives an immediate `409 Conflict` termination event.

---

### 2.4 Synchronized Showtimes & 4-Zone Catch-Up Engine

- **Lobby Phase (T-30m to T-0)**: The auditorium opens 30 minutes before showtime. Attendees enter the room, review film trivia, test audio/voice settings, and chat.
- **Memory Pre-Buffering (T-90s)**: At 90 seconds before curtain rise, the player requests authorized DRM licenses and pre-buffers 3 media segments (12 seconds) strictly into RAM.
- **Curtain Rise (T-0)**: Synchronized playhead trigger across all connected clients.
- **4-Zone Catch-Up Engine**:
  - _Zone 1 (Live Edge, 0-3s lag)_: Normal playback.
  - _Zone 2 (Minor Drift, 4-30s lag)_: Seamless micro-acceleration (1.05x speed) without audio pitch distortion to catch up to live edge.
  - _Zone 3 (Buffering Gap, 31s-10m lag)_: Viewer can remain behind live edge; chat interface displays an active **"Mute Spoilers"** shield.
  - _Zone 4 (Extended Buffer, up to 15m post-credits)_: Auditorium room remains alive for 15 minutes after film conclusion to allow drifting attendees to finish the climax.

---

### 2.5 Financial Model & Pass-Through Concessions

- **Pass-Through Paystack Processing**:
  - Nigeria Paystack fee (1.5% + ₦100, capped at ₦2,000) is grossed up and paid by the purchaser at checkout.
  - Small business VAT-exempt status under the Nigeria Tax Act 2025.
- **85/15 Box Office Split**:
  - 85% of net ticket revenue flows directly to the producer/distributor.
  - 15% platform commission retained by Koncave.
  - For Private Suites, a 20% room infrastructure premium covers LiveKit SFU WebRTC bandwidth and is retained 100% by Koncave.
- **Chowdeck Relay Concessions (DaaS)**:
  - Cinema snacks (fresh popcorn, cold sodas, gourmet combos) ordered during checkout or up to T-50m.
  - JIT dispatch sends courier to deliver orders 15–30 minutes before film start.

---

## 3. Seven-Day Frontend Implementation Roadmap

```txt
+-----------------------------------------------------------------------------------+
| SPRINT 1: Foundation, Legal Infrastructure & Public Routes                        |
| Status: IN PROGRESS                                                               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| SPRINT 2: Interactive Catalog, Showtime Booking, In-Checkout KYC & Concessions    |
| Status: QUEUED                                                                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| SPRINT 3: Virtual Cinema Auditorium, Mux DRM, Watermark & LiveKit WebRTC Voice    |
| Status: QUEUED                                                                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| SPRINT 4: Producer Distribution Portal, Financial Settlement & Production Launch  |
| Status: QUEUED                                                                    |
+-----------------------------------------------------------------------------------+
```

Detailed sprint plans with actionable checklists are available in:

- [Sprint 1: Foundation & Public Routes](file:///c:/Users/HP/Documents/koncavecinema-web/docs/roadmap/01-sprint-1-foundation-and-public-routes.md)
- [Sprint 2: Catalog, In-Checkout KYC & Booking](file:///c:/Users/HP/Documents/koncavecinema-web/docs/roadmap/02-sprint-2-catalog-and-booking.md)
- [Sprint 3: Cinema Room, Streaming & WebRTC Voice](file:///c:/Users/HP/Documents/koncavecinema-web/docs/roadmap/03-sprint-3-cinema-room-and-streaming.md)
- [Sprint 4: Producer Portal & Launch Hardening](file:///c:/Users/HP/Documents/koncavecinema-web/docs/roadmap/04-sprint-4-producer-portal-and-production.md)
