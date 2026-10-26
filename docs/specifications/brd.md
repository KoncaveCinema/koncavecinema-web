# Business Requirements Document (BRD)

**KONCAVE CINEMA APP**  
_Enterprise Business Requirements Document: Market Opportunity, Cinema Tiers, Regulatory Compliance & Operational Blueprint._

---

## 1. Executive Summary

**Koncave Cinema** is a proprietary Direct-to-Consumer (D2C) scheduled-streaming platform spearheaded by a veteran Nollywood producer. The platform directly tackles the existential economic bottleneck facing African cinema: the crippling revenue-share monopolies of physical theatrical cinema chains and the unprofitable, piracy-prone economics of public video-sharing portals such as YouTube.

By digitizing the theatrical experience, Koncave Cinema preserves the high-yield exclusivity of movie premieres through:

- **Strictly Synchronized Showtimes**: Digital ticket admissions where all viewers experience the premiere simultaneously.
- **Communal & Social Viewing Halls**: Ranging from solitary viewing to live communal public halls and private, voice-enabled VIP suites.
- **Automated Concession Delivery**: Hyper-local Food & Beverage (F&B) delivery dispatch timed to arrive at viewers' doorsteps prior to showtime.
- **Bank-Grade Anti-Piracy**: Hardware-enforced Multi-DRM (Widevine, FairPlay, PlayReady), dynamic forensic watermarking, and short-lived tokenized stream manifests.

Producers retain **85% to 92%** of gross ticketing revenues, shortening capital recovery timelines and empowering independent creative autonomy.

---

## 2. Business Problem & Market Opportunity

### 2.1 The Nollywood Theatrical Distribution Trap

Physical cinema exhibition in Nigeria imposes an unsustainable financial tax on independent filmmakers:

- **Taxation Deductions at Source**: On a gross box office revenue of N1,000,000,000 (~$650k USD), 10% is immediately excised at point of sale—comprising 5% Federal Value Added Tax (VAT) and 5% State Entertainment Tax (e.g., LIRS), leaving a net of N900M.
- **Exhibitor Sliding Scales**: Cinema chains (e.g., Filmhouse, Genesis, Silverbird) retain the majority of net revenue on an escalating scale: 50% in Week 1, escalating to 55% in Week 2, and 60% by Week 3 onwards.
- **Distributor Retainers & Tariffs**: Film distributors charge an additional 10% to 15% distribution fee on net box office, on top of billing aggressive physical marketing, trailer mastering, and DCP transport fees back to the producer.
- **The Producer's Remnant**: A film grossing N1 Billion in physical theatres yields only N300M to N400M (30%–40%) in take-home profit for the producer. After paying multi-hundred-million-naira production budgets, net margins approach zero or fall into deficit.

### 2.2 The Pitfalls of the YouTube Paradigm

Frustrated by theatrical cartels, producers often turn to YouTube. However, this creates severe commercial compromises:

- **Abysmal Regional AdSense RPMs**: Nigerian audience impressions yield an effective Revenue Per Mille (RPM) between $0.50 and $1.50 per 1,000 views. Recouping a N50,000,000 budget requires 45 to 65 million views—statistically improbable for 99% of feature films.
- **Zero Intellectual Property Defense**: Public video platforms provide zero defense against automated stream rippers (e.g., `yt-dlp`). Master video files are duplicated onto Telegram and torrent sites within minutes.

### 2.3 The Koncave Cinema D2C Value Proposition

- **Direct Revenue Capture**: Eliminating physical chains allows producers to retain 85% to 92% of gross ticketing revenue.
- **Global Diaspora Monetization**: Multi-currency checkout (USD, GBP, EUR, NGN, BTC) catering directly to high-purchasing-power Nigerian diaspora communities in North America and Europe.
- **High-Margin Ancillary Concession Revenue**: Replicating cinema concession margins by bundling popcorn and beverage orders directly into checkout via automated last-mile dispatch APIs.

---

## 3. Cinema Hall Taxonomy & Pricing Architecture

| Tier Name              | Base Pricing   | Social & Communication Features                             | Target Audience & Use Case                                                                |
| :--------------------- | :------------- | :---------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Individual Watch**   | N5,000 flat    | Zero interaction (Isolated player viewport).                | Solo viewer seeking cinema seclusion and uncompressed 4K/1080p ABR playback.              |
| **Public Theatres**    | N5,000 / seat  | Real-time Text Chat only. Strictly No Voice/Video.          | Communal cinema hall experience with live community banter and shared cultural reactions. |
| **Private Suite (5)**  | N30,000 / room | Text Chat + Full-Duplex WebRTC Voice (Host Admin controls). | Close-knit friend groups, virtual family gatherings, virtual movie dates.                 |
| **Private Suite (10)** | N60,000 / room | Text Chat + Full-Duplex WebRTC Voice (Host Admin controls). | Larger watch parties, diaspora social mixers, corporate events.                           |

### Dynamic Producer Pricing & Double-Margin Revenue Architecture

- Producers set a **Base Ticket Price ($P$)**, constrained between N2,500 and N10,000.
- **Double-Margin Revenue Split**:
  1. **Base Commission**: Koncave deducts a 15% platform distribution fee from the gross Base Ticket Price ($P$) across all tiers.
  2. **Infrastructure Premium**: Private Suites are calculated as `(P * Capacity) + 20%`. This 20% markup is an infrastructure premium (covering LiveKit WebRTC costs) and is retained 100% by Koncave Cinema.
- **Statutory Taxes & Gateway Fees**: Payment gateway processing fees (Paystack: 1.5% + NGN 100) are paid by the customer at checkout as a pass-through charge, protecting 100% of the box office pool. VAT (7.5%) is not charged while the company is a VAT-exempt small business under the Nigeria Tax Act 2025 (turnover of NGN 100M or less) and is held for remittance to the Nigeria Revenue Service once registration is required.

---

## 4. Key Functional Stakeholder Requirements

1. **The Solitary Cinephile (Individual Watch)**: Uninterrupted 1080p ABR video, zero chat notifications, distraction-free theatre ambiance, and zero KYC requirements.
2. **The Communal Cinema Goer (Public Theatre)**: Shared virtual room with hundreds of viewers, high-speed text chat with emojis, verified and troll-free community via seamless in-checkout phone KYC verification.
3. **The Private Room Host (VIP Suite)**: Frictionless invite link, low-latency audio interaction over the film, administrative moderation (Mute Individual, Mute All, Knock Admission, Revoke Invite, Sync Pause).
4. **The Content Producer / Studio Admin**: Secure master ingest, granular scheduling controls, real-time ticket sales telemetry, anti-piracy leak monitoring, and automated settlement reports.
5. **The Logistics Fulfillment Courier (Chowdeck Relay)**: Third-party dispatch couriers provisioned automatically via API to deliver popcorn and drinks prior to showtime.

---

## 5. Regulatory & Licensing Governance

- **National Film and Video Censors Board (NFVCB Act No. 85)**: All films exhibited digitally must possess an official NFVCB classification certificate (G, PG, 12, 15, or 18). Publishing without certification is prohibited.
- **Nigeria Data Protection Act (NDPA 2023)**: Prohibits excessive personal data collection (proportionality principle). Direct NIN/BVN collection is forbidden; 3-point KYC uses NCC mobile number HMAC-SHA256 hashing and Resend Email OTP verification.
- **International Privacy Frameworks (GDPR & CCPA)**: Explicit cookie controls, privacy notices, and automated Right to Erasure endpoints for diaspora patrons.
