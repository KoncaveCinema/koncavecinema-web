# Regulatory, Statutory & Legal Compliance Framework

## 1. Statutory Nigerian Legal Landscape

Operating a digital scheduled-streaming cinema within Nigeria requires strict adherence to statutory authorities governing digital media exhibition, cybersecurity, telecommunications, and data privacy.

---

## 2. Nigeria Data Protection Act (NDPA 2023) Compliance

### 2.1 The Principle of Proportionality (Section 24)

Under Section 24 of the NDPA 2023, data controllers cannot collect excessive or disproportionate personal data relative to the specific processing purpose.

- **Legal Prohibition**: Directly demanding National Identification Numbers (NIN) or Bank Verification Numbers (BVN) to enter a recreational movie chat room is legally disproportionate and exposes the platform to severe enforcement penalties from the Nigeria Data Protection Commission (NDPC).
- **The Proportional Solution**: Leveraging indirect, government-grade identity verification via mobile telecommunications binding.

### 2.2 The Statutory 3-Point KYC Blueprint

To prevent cyber-harassment, piracy syndicates, and defamation in Public Theatres while remaining compliant with NDPA 2023:

1. **Cryptographic Identity Verification (Resend Email OTP)**:
   - The user's account identity is verified via an unguessable 6-digit cryptographic OTP dispatched to their registered email and stored in Redis with a 300-second TTL.
   - For additional statutory binding, mobile numbers are permanently hashed using **HMAC-SHA256** with an environment secret pepper (`PHONE_HASH_SECRET`) before database storage without collecting sensitive biometric data directly.
2. **Encrypted Legal Name & Unique Public Screen Alias**:
   - The user registers their full legal name and an anonymous Public Screen Alias (e.g., `CinemaBuff_99`).
   - The legal name is encrypted at rest (AES-256-GCM) and is never exposed across frontend views or public chat sockets. Only the public alias is visible.
3. **Statutory Acceptance of Terms & Audit Logging**:
   - Explicit consent checkbox acknowledging that chat transcripts are logged with timestamped IP addresses and Device Fingerprints.
   - In the event of criminal defamation, extortion, terror threats, or piracy coordination, immutable `AuditLog` records can be furnished to the Nigeria Police Force Cybercrime Unit under the **Cybercrimes (Prohibition, Prevention, etc.) Amendment Act 2024**.

---

## 3. National Film and Video Censors Board (NFVCB Act No. 85)

Under Act No. 85 of 1993, all commercial motion pictures publicly exhibited in Nigeria—including digital web streaming and video-on-demand—must obtain formal classification and censorship certification:

- **Classification Ratings**:
  - `G`: General Exhibition
  - `PG`: Parental Guidance
  - `12`: Not suitable for children under 12
  - `15`: Not suitable for children under 15
  - `18`: Strictly for adults aged 18 and above
- **Enforcement Gate in Backend**:
  - The `MoviesModule` and `ShowtimesModule` implement an automated validation gate.
  - No showtime can be scheduled or published without a valid `nfvcbCertNumber` and a verified document attachment link (`nfvcbCertUrl`).
  - Distributing unclassified content is a criminal offense subject to statutory fines and platform shutdown.

---

## 4. International Privacy Standards (GDPR & CCPA)

To cater to high-value Nigerian diaspora audiences across the UK, European Union, and North America:

1. **Data Minimization & Transparency**: Explicit cookie preference toggles and transparent disclosures regarding telemetry and IP logging.
2. **Right to Erasure (Article 17 GDPR)**: An automated workflow allowing users to request account deletion (`DELETE /api/users/me`), scrubbing personal identifiers while retaining anonymized transaction logs required for tax accounting.
3. **Data Protection Compliance Audits**: Filing annual statutory data audits with the NDPC through a licensed Data Protection Compliance Organization (DPCO).

---

## 5. TVOD Producer Licensing & Legal Warranties

When onboarding external filmmakers, standard TVOD licensing agreements mandate:

- **Global Digital Rights Warranty**: Formal declaration that the producer possesses unencumbered worldwide streaming rights.
- **Music & Synchronization Clearances**: Proof that all musical soundtrack compositions, score recordings, and sound effects are fully licensed.
- **Talent Releases**: Verified release forms for all principal cast, supporting actors, and background extras.
- **Settlement Terms**: Net payout intervals (14 days post-premiere) based on the audited box office ledger.

---

## 6. Official Regulatory References & Documentation

- [Nigeria Data Protection Commission (NDPC)](https://ndpc.gov.ng/) - Official regulatory portal and compliance guidelines
- [Nigeria Data Protection Act 2023 (NDPA Text)](https://ndpc.gov.ng/Files/ndpa2023.pdf) - Full statutory legal text and Section 24 proportionality requirements
- [National Film and Video Censors Board (NFVCB)](https://nfvcb.gov.ng/) - Film censorship, digital classification criteria, and verification guidelines
- [Cybercrimes (Prohibition, Prevention, etc.) Amendment Act 2024](https://cert.gov.ng/) - National cybersecurity legislation and law enforcement audit mandates
- [EU General Data Protection Regulation (GDPR)](https://gdpr.eu/) - Official guide to GDPR compliance and Article 17 Right to Erasure
