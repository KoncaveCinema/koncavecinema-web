# Sprint 4: Producer Distribution Portal, Financial Settlement & Production Launch

## Objective

Equip independent filmmakers and distributors with transparent real-time box office analytics, digital TVOD agreement acceptance, and automated 85% revenue settlement ledgers. Harden the entire application for production deployment, conduct comprehensive performance audits, and finalize readiness for the December launch.

---

## Actionable Execution Checklist

### 1. Producer Distribution Portal (`/studio`)

- [ ] Implement `src/features/studio/components/studio-dashboard.tsx`:
  - [ ] Secure filmmaker authentication and role-based access control (`ROLE_PRODUCER`).
  - [ ] Film portfolio overview (Active Screenings, Upcoming Premieres, Archived Runs).
  - [ ] Submission workflow for new titles:
    - [ ] Video asset upload (ProRes / High-bitrate master for Mux DRM encoding).
    - [ ] NFVCB Certificate upload and validation.
    - [ ] Key art, poster, and trailer links.
    - [ ] Cast/crew credits and synopsis.

### 2. Digital Producer Distribution Agreement Acceptance

- [ ] Implement `src/features/studio/components/agreement-acceptance-modal.tsx`:
  - [ ] Embedded review of `docs/legal/producer-distribution-agreement.md`.
  - [ ] Explicit affirmation of key terms:
    - [ ] 85% net box office allocation to producer.
    - [ ] 15% platform commission to Koncave Cinema.
    - [ ] Non-exclusive theatrical TVOD windowing terms.
    - [ ] Anti-piracy covenants and liability warranties.
  - [ ] Cryptographic signature binding (Legal full name, timestamp, IP address, and hash of agreement version).

### 3. Real-Time Box Office & Financial Settlement Engine

- [ ] Implement `src/features/studio/components/box-office-ledger.tsx`:
  - [ ] Real-time ticket sales counter broken down by tier:
    - Individual Watch tickets sold (₦5,000 each).
    - Public Theatre seats occupied (₦5,000 each).
    - Private Suites reserved (₦30,000 / ₦60,000 each).
  - [ ] Gross Box Office (GBO) tally vs. Net Box Office (NBO) after Paystack gateway deductions.
  - [ ] Automated 85% producer earnings calculation ledger.
  - [ ] Weekly settlement payout status (Initiated, Processing, Paid) with exportable CSV / PDF financial statements.

### 4. Robustness, Error Boundaries & Offline Degradation

- [ ] Implement `src/components/feedback/global-error-boundary.tsx`:
  - [ ] Graceful recovery interfaces for failed network requests, stream disconnects, and API timeouts.
  - [ ] Fallback static mock fixtures toggle if backend API experiences maintenance.
  - [ ] Live internet connectivity status toaster (`useOnlineStatus`).

### 5. Production Optimization & Launch Readiness Audit

- [ ] **Core Web Vitals Optimization**:
  - [ ] Largest Contentful Paint (LCP) under 1.8s across 3G/4G Nigerian mobile networks.
  - [ ] Cumulative Layout Shift (CLS) of 0.00.
  - [ ] First Input Delay (FID) / INP under 100ms.
- [ ] **Accessibility & Cross-Device Compatibility**:
  - [ ] WCAG 2.1 AA contrast compliance across all cinema dark mode surfaces.
  - [ ] Full responsiveness tested on iOS Safari, Android Chrome, and Desktop browsers.
  - [ ] Touch-target minimum of 48px on all interactive mobile buttons.
- [ ] **Final Deployment Configuration**:
  - [ ] Staging and production environment variables verified.
  - [ ] Custom domain DNS verification (`koncavecinema.com`, `www.koncavecinema.com`, `api.koncavecinema.com`).
  - [ ] December launch readiness sign-off.
