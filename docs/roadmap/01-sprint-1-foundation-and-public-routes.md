# Sprint 1: Foundation, Legal Infrastructure & Public Routes

## Objective

Establish the regulatory, informational, and visual foundation of Koncave Cinema. Implement all public legal disclosures, support workflows, regulatory compliance pages (NDPA 2023, NFVCB), and shared layout shells.

---

## Actionable Execution Checklist

### 1. Document Migration & Archival

- [x] Move legal contracts (`terms-of-service.md`, `producer-distribution-agreement.md`) from backend codebase to `docs/legal/`.
- [x] Copy system specifications (`brd.md`, `prd.md`, `financial-model.md`, `regulatory-compliance.md`) from backend to `docs/specifications/`.
- [x] Create comprehensive frontend roadmap folder (`docs/roadmap/`) with discrete sprint specifications and checklists.

### 2. Legal Page Architecture & Shared Layout Shell

- [x] Create `src/components/layout/legal-page-shell.tsx` component:
  - [x] Dark theatre background with subtle ambient glows (`bg-background`).
  - [x] Sticky left-hand Table of Contents with smooth section jumping.
  - [x] Prominent regulatory metadata: Effective Date, Last Revised, Version ID.
  - [x] Regulatory compliance badges: NDPA 2023 Compliant, NFVCB Regulated, 256-Bit SSL Encryption.
  - [x] Print / PDF download trigger.

### 3. Public Legal Pages

- [x] **Terms of Service** (`src/app/(marketing)/terms/page.tsx`):
  - [x] Full terms of service adapted from `docs/legal/terms-of-service.md`.
  - [x] Single-device streaming license restrictions, anti-piracy covenants, account security.
  - [x] Governed by the laws of the Federal Republic of Nigeria.
- [x] **Privacy Policy** (`src/app/(marketing)/privacy/page.tsx`):
  - [x] NDPA 2023 compliant data minimization declaration (proportionality principle, Section 24).
  - [x] Transparent explanation of why NIN and BVN are never collected.
  - [x] Explanation of the 3-point KYC protocol (HMAC-SHA256 phone hashing, legal name encryption, alias binding).
  - [x] Data Protection Officer (DPO) contact credentials.
- [x] **Refund & Cancellation Policy** (`src/app/(marketing)/refunds/page.tsx`):
  - [x] Standard non-refundable policy for completed scheduled screenings.
  - [x] Automatic full credit/refund triggers for platform server failures or unresolved DRM playback blackouts.
  - [x] Concessions refund policy (handled via Chowdeck Relay SLA prior to kitchen dispatch).
- [x] **Cookie Policy** (`src/app/(marketing)/cookies/page.tsx`):
  - [x] Essential session cookies (JWT authentication, room state, volume preferences).
  - [x] Zero third-party ad-tracking or cross-site behavior profiling.
  - [x] Cookie consent management mechanism.

### 4. Public Information, Producer & Support Routes

- [x] **Filmmaker & Producer Distribution** (`src/app/(marketing)/producers/page.tsx`):
  - [x] The Nollywood Problem & 85/15 Revenue Split explanation.
  - [x] Comparison table: Physical Theatrical Chains (40-50% net) vs. Koncave Cinema (85% net).
  - [x] Anti-piracy features: Mux DRM, dynamic watermarking, concurrency locks.
  - [x] Producer distribution application modal / submission form.
- [x] **Support & Contact Center** (`src/app/(marketing)/contact/page.tsx`):
  - [x] Departmental inquiry routing: General Support, Producer Inquiries, Press & Media, Legal/DPO.
  - [x] Direct WhatsApp support concierge and email dispatch (`support@koncavecinema.com`).
  - [x] Guaranteed response SLA (15 minutes during live showtimes, 4 hours general).
- [x] **Knowledge Base & Help Center** (`src/app/(marketing)/help/page.tsx`):
  - [x] Interactive categorized FAQ tabs:
    - [x] Purchasing & Showtime Schedules.
    - [x] Streaming, DRM & Browser Compatibility.
    - [x] Private Suites & Audio Lounge Controls.
    - [x] Chowdeck Popcorn & Concessions Delivery.
    - [x] Public Theatre KYC & Alias Verification.
  - [x] Real-time search filter for knowledge base questions.

### 5. Site Navigation & Verification

- [x] Register all new routes in `src/app/sitemap.ts` with appropriate change frequencies and priorities.
- [x] Update `src/components/layout/footer.tsx` to enable fast prefetching for all public routes.
- [x] Run full CI test suite: `npm run lint:check`, `npm run typecheck`, `npm run format:check`, and `npm run build`.
