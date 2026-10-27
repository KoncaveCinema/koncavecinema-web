# Terms of Service & End-User License Agreement

**KONCAVE CINEMA NIGERIA LIMITED**  
_Effective Date: October 2026_  
_Last Updated: October 8, 2026_

---

## 1. Acceptance of Terms

Welcome to **Koncave Cinema** (the "Platform", "Service", "we", "us", or "our"), operated by **Koncave Cinema Nigeria Limited**, a private limited liability company incorporated under the Companies and Allied Matters Act (CAMA 2020) of the Federal Republic of Nigeria.

By accessing, registering an account on, or purchasing virtual admission passes through Koncave Cinema (via `koncavecinema.com`, our web application, or authorized client interfaces), you ("User", "Viewer", "Patron", or "you") agree to be bound by these **Terms of Service** ("Terms") and our [Privacy Policy](../specifications/regulatory-compliance.md).

**IF YOU DO NOT AGREE TO THESE TERMS, DO NOT CREATE AN ACCOUNT, PURCHASE TICKETS, OR ATTEMPT TO ACCESS OUR STREAMS.**

---

## 2. Description of the Service

Koncave Cinema is a cloud-native direct-to-consumer (D2C) virtual cinema platform that licenses and exhibits premium Nollywood and international motion pictures. The platform delivers scheduled, synchronized "Simulated Live" premieres featuring:

1. **Individual Watch**: Solo cinema viewing with dynamic Adaptive Bitrate (ABR) playback.
2. **Public Theatres (Communal Halls)**: Synchronized communal screenings accompanied by real-time moderated text chat.
3. **Private VIP Suites**: Intimate virtual rooms for 5 or 10 participants featuring synchronized stream playback and full-duplex WebRTC voice mesh communication.
4. **Food & Beverage (F&B) Delivery**: Geofenced last-mile concession delivery bundled into premiere checkout via third-party logistics integrations (Chowdeck Relay).

---

## 3. Account Registration & Statutory KYC Compliance

### 3.1 Eligibility & Age Classification

- You must be at least 13 years of age to register an account.
- Film exhibitions on Koncave Cinema are classified according to the statutory classification guidelines of the **National Film and Video Censors Board (NFVCB)**:
  - **General (G) / Parental Guidance (PG)**: Accessible to all registered viewers.
  - **12 / 15 / 18 Ratings**: You certify that you meet the minimum statutory age requirement for each respective title.
- Koncave Cinema reserves the right to restrict access to age-restricted screenings.

### 3.2 Statutory Phone Verification (Public Theatres)

In compliance with the **Cybercrimes (Prohibition, Prevention, etc.) Act 2015** and the **Nigeria Data Protection Act (NDPA) 2023**:

- Admission into **Public Theatres** requires mandatory phone verification (KYC).
- We dispatch a one-time verification code (OTP) to your registered email or phone number.
- In accordance with our data minimization mandate:
  - Your raw telephone number is **never stored in plaintext**.
  - It is cryptographically converted into an irreversible HMAC-SHA256 hash (`phoneHash`) used exclusively to enforce single-account binding and combat communal harassment, hate speech, or piracy distribution.
- You agree to provide accurate, lawful information when binding your legal full name and alias.

---

## 4. Ticketing, Pricing & Payment Terms

### 4.1 Virtual Admission Passes

- Admissions on Koncave Cinema are virtual, time-bound licenses granting personal, non-commercial, revocable access to view a specific film at a designated showtime.
- A virtual ticket does **not** convey ownership, distribution rights, or permanent download rights to any audio or visual media.

### 4.2 Reservation Holds & Checkout

- When reserving a ticket, an atomic seat hold is placed for **10 minutes (600 seconds)**.
- If payment is not completed within 10 minutes, the hold expires and the admission slot is released to other viewers.
- If a late payment is received for an expired hold, Koncave Cinema will honour the pass provided you do not already possess an active pass for that screening; otherwise, the payment will be flagged for an automated refund.

### 4.3 Transparent Pricing & Pass-Through Payment Fees

- Ticket prices are set by the filmmaker/producer in Nigerian Naira (NGN) or authorized diaspora currencies (USD, GBP, EUR).
- **Payment Processing Fees**: Transaction fees charged by our authorized payment gateway (**Paystack**: 1.5% + ₦100, capped at ₦2,000 for domestic cards) are clearly itemized and paid by the user at checkout as a pass-through processing fee.
- **Statutory Taxes**: While Koncave Cinema qualifies as a small business under the Nigeria Tax Act 2025 and the Nigeria Tax Administration Act 2025, no VAT is charged. Once Koncave Cinema is required to register for VAT, statutory 7.5% VAT will be itemized transparently at checkout.

### 4.4 Currency of Transaction

Transactions are billed in the currency displayed at checkout. Your card issuer or bank may apply foreign exchange conversion rates or cross-border transaction fees over which Koncave Cinema has no control.

---

## 5. Streaming Policies, Concurrency & Single-Device Limit

### 5.1 Single-Viewer Concurrency Lock

- Each admission pass is strictly licensed for a **single concurrent device and viewport**.
- Attempting to access the stream simultaneously from a second device, browser, or IP address will result in the immediate revocation of the prior session.
- System monitors enforce an impossibility threshold (e.g., concurrent logins from geographically impossible locations); suspicious sessions are terminated immediately.

### 5.2 Scheduled Premiere Windows & Buffer Drift Tolerance

- **Virtual Lobby**: The screening room lobby opens **30 minutes prior** to the scheduled premiere start time.
- **Live Screening**: Video playback begins simultaneously for all viewers at the scheduled showtime ($T-0$).
- **Buffer Drift Allowance**: To accommodate cellular network jitter and temporary buffering, stream access remains active for up to **15 minutes following the conclusion of the film's runtime**. Once the drift window closes, stream tokens expire globally.

---

## 6. Private VIP Suite Governance

1. **Host Authority**: The purchaser of a Private Suite (the "Host") is responsible for distributing the unique invite code (`VIP-XXXXXX`) to invited companions.
2. **Capacity Caps**:
   - Private Suite 5: Maximum of 5 active participants (Host + 4 guests).
   - Private Suite 10: Maximum of 10 active participants (Host + 9 guests).
3. **Voice Audio Etiquette**: Private Suites feature real-time, full-duplex WebRTC voice communication. Hosts possess in-room administrative privileges to mute individual participants, mute all participants, or revoke invitation tokens.

---

## 7. Intellectual Property & Zero-Tolerance Anti-Piracy Policy

### 7.1 Copyright Ownership

All motion pictures, trailers, artwork, music, and trademarks exhibited on Koncave Cinema are the exclusive intellectual property of their respective producers, copyright holders, and Koncave Cinema Nigeria Limited, protected under the **Copyright Act 2022** of Nigeria and international treaties (Berne Convention).

### 7.2 Prohibited Anti-Piracy Violations

You expressly agree that you shall NOT, directly or indirectly:

1. Capture, record, rip, re-stream, screen-record, or download any video or audio stream using any software, browser extension, hardware capture card, or mobile device.
2. Circumvent, decrypt, or tamper with Digital Rights Management (DRM) technologies, including Google Widevine, Apple FairPlay, Microsoft PlayReady, or the platform's signed stream access controls.
3. Exhibit, broadcast, or display any screening in a public venue, commercial establishment, bar, physical theatre, or charging admission to third parties without prior written commercial licensing from Koncave Cinema.
4. Distribute or publish any ticket access tokens, decrypted manifests (`.m3u8`), or video segment URLs.

### 7.3 Forensic Dynamic Watermarking

- **Legal Notice**: All video streams rendered within your viewport are dynamically and forensically watermarked with semi-transparent, pseudo-randomly shifting canvas overlays embedding your unique User ID, Ticket Identifier, and IP timestamp.
- Any leaked video snippet found on public file-sharing networks, social media, or torrent sites will be forensically traced to your account.
- **Legal Consequences**: Violators will face immediate account termination, forfeiture of all tickets, blacklisting across the platform, and aggressive civil and criminal prosecution under Sections 36–44 of the **Copyright Act 2022** and Section 22 of the **Cybercrimes Act 2015**.

---

## 8. Cancellation & Refund Policy

1. **Digital Virtual Goods**: Due to the live, scheduled nature of virtual cinema exhibitions, **tickets are non-refundable once purchased**, except in the following limited circumstances:
   - The scheduled screening is cancelled by Koncave Cinema or the filmmaker.
   - A catastrophic platform infrastructure failure prevents more than 50% of the audience from accessing the stream for more than 20 consecutive minutes.
2. **User-Side Technical Issues**: Koncave Cinema is not responsible for stream degradation, buffering, or failure to attend resulting from the user's insufficient internet bandwidth, unsupported browser versions, device failure, or local power outages.
3. **Concession Orders**: Concession meals dispatched via Chowdeck Relay cannot be cancelled once the partner restaurant begins preparation (T-minus 50 minutes). If food is undelivered due to courier error, an automated platform voucher or refund will be credited.

---

## 9. Code of Conduct & Communal Chat Rules

In Public Theatres and community features, you agree NOT to:

- Transmit hate speech, tribal slurs, sexually explicit text, defamation, harassment, or threats.
- Spam links, commercial advertisements, or unauthorized solicitations.
- Reveal movie spoilers in chat prior to the on-screen occurrence.
- Violators will be muted or permanently banned from Public Theatres without ticket refunds.

---

## 10. Limitation of Liability & Warranty Disclaimer

1. **"As-Is" Service**: The platform is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for 99.9% uptime, we do not guarantee uninterrupted, error-free streaming across all third-party internet service providers.
2. **Cap on Liability**: To the maximum extent permitted by Nigerian law, Koncave Cinema Nigeria Limited's total liability for any claim arising out of your use of the Service shall not exceed the amount actually paid by you for the specific ticket transaction giving rise to the dispute.

---

## 11. Governing Law & Dispute Resolution

These Terms shall be governed by and construed in accordance with the **laws of the Federal Republic of Nigeria**.

Any dispute, controversy, or claim arising out of or relating to these Terms shall first be submitted to informal mediation between the parties. If unresolved within thirty (30) days, the dispute shall be submitted to binding arbitration in Lagos State, Nigeria, conducted in English under the Arbitration and Mediation Act 2023.

---

## 12. Contact Information

If you have questions, compliance inquiries, or need support regarding these Terms:

- **Entity**: Koncave Cinema Nigeria Limited
- **Legal & Compliance**: `info@koncavecinema.com`
- **Customer Support**: `info@koncavecinema.com`
- **Physical Address**: Victoria Island, Lagos, Nigeria
