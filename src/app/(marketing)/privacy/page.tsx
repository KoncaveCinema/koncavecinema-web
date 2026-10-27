import { Ban, CheckCircle2, EyeOff, Fingerprint, Lock, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";

import { LegalPageShell, type TocItem } from "@/components/layout/legal-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy & NDPA Compliance | Koncave Cinema",
  description:
    "Learn how Koncave Cinema safeguards your personal data under the Nigeria Data Protection Act (NDPA 2023) through data minimization and cryptographic hashing.",
};

const TOC: TocItem[] = [
  { id: "principles", title: "1. Privacy Principles & Architecture" },
  { id: "data-minimization", title: "2. NDPA 2023 Data Minimization (No NIN/BVN)" },
  { id: "information-matrix", title: "3. Information We Collect vs What We Never Collect" },
  { id: "statutory-kyc", title: "4. In-Checkout KYC Protocol (Public Theatres)" },
  { id: "how-we-use-data", title: "5. Legal Bases & Purpose of Processing" },
  { id: "payment-processing", title: "6. Payment Security & Pass-Through Data" },
  { id: "concession-delivery", title: "7. Concessions & Geofencing (Chowdeck Relay)" },
  { id: "data-retention", title: "8. Retention Schedules & DRM Expiration" },
  { id: "your-rights", title: "9. Your NDPA 2023 Data Subject Rights" },
  { id: "privacy-contact", title: "10. Privacy Inquiries & Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy & NDPA 2023 Compliance"
      subtitle="Koncave Cinema is built on strict data minimization. We protect your privacy while delivering synchronized, premium virtual cinema premieres."
      effectiveDate="October 2026"
      lastUpdated="October 25, 2026"
      version="1.3.0"
      toc={TOC}
      activePath="/privacy"
    >
      {/* =========================================================================
          CREATIVE AT-A-GLANCE SUMMARY CARDS
          ========================================================================= */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <EyeOff className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Zero Surveillance Advertising</h3>
              <p className="text-xs text-muted-foreground">
                No tracking pixels or third-party ad brokers
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            We never monitor your browsing across other sites, sell personal viewing logs, or
            integrate intrusive ad networks like Facebook Pixel or Google AdSense.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Fingerprint className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">NDPA 2023 Proportionality</h3>
              <p className="text-xs text-muted-foreground">
                Never asking for sovereign financial IDs
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Zero BVN or NIN collection. Cinema entertainment does not justify collecting sovereign
            identity numbers under statutory Nigerian privacy laws.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Lock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Cryptographic Token Leases</h3>
              <p className="text-xs text-muted-foreground">
                Hardware Mux DRM with auto-expiring keys
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Playback sessions are secured via hardware-encrypted DRM tokens that expire
            automatically upon the conclusion of your scheduled screening room.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <UserCheck className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Complete Data Sovereignty</h3>
              <p className="text-xs text-muted-foreground">
                Rapid account deletion &amp; export rights
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Exercise your right to erasure or request an audit copy of all stored account
            information by contacting our support team at info@koncavecinema.com.
          </p>
        </Card>
      </div>

      {/* SECTION 1 */}
      <section id="principles" className="space-y-4">
        <h2>1. Privacy Principles &amp; Architecture</h2>
        <p>
          Koncave Cinema Nigeria Limited (&ldquo;Koncave Cinema&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) is committed to respecting and protecting the privacy of our viewers,
          filmmakers, and visitors. We operate in strict compliance with the{" "}
          <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and international data privacy
          standards.
        </p>
        <p>
          Our technology architecture is intentionally engineered around three non-negotiable
          principles:
        </p>
        <ul>
          <li>
            <strong>Data Minimization:</strong> We collect only the absolute minimum data required
            to reserve your seat, authorize playback, and prevent unauthorized recording.
          </li>
          <li>
            <strong>Cryptographic Obfuscation:</strong> Sensitive communication identifiers are
            irreversibly hashed before touching persistent database storage.
          </li>
          <li>
            <strong>Zero Monetization of Identity:</strong> We do not sell, rent, or trade viewer
            identities, viewing histories, or private chat logs to third-party data brokers.
          </li>
        </ul>
      </section>

      {/* SECTION 2 */}
      <section id="data-minimization" className="space-y-4 pt-8">
        <h2>2. NDPA 2023 Data Minimization (Why We Never Collect NIN or BVN)</h2>
        <p>
          Under Section 24 of the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>, personal
          data processing must be adequate, relevant, and limited to what is strictly necessary in
          relation to the declared purposes (the &ldquo;Proportionality Principle&rdquo;).
        </p>

        <div className="not-prose my-6 rounded-2xl border border-brand/30 bg-brand/5 p-6 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 shrink-0 text-brand" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Statutory Privacy Invariant</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Koncave Cinema will{" "}
                <strong>
                  never request your National Identity Number (NIN) or Bank Verification Number
                  (BVN)
                </strong>
                . Requesting sovereign civil identity or banking credentials for theatrical
                entertainment is disproportionate, unlawful, and unnecessary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 */}
      <section id="information-matrix" className="space-y-4 pt-8">
        <h2>3. Information We Collect vs What We Never Collect</h2>
        <p>
          To maintain absolute transparency, the matrix below contrasts the operational metadata we
          collect with the intrusive data points we reject by default:
        </p>

        <div className="not-prose my-6 overflow-hidden rounded-2xl border border-white/10 bg-surface-1/80 shadow-xl">
          <div className="grid divide-y divide-white/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {/* What we collect */}
            <div className="p-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-4" />
                <h4 className="text-sm font-bold tracking-wider uppercase">What We Collect</h4>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>Account Email:</strong> For magic OTP logins and ticket pass delivery.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>Showtime Reservations:</strong> Scheduled screening time and auditorium
                    choice.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>DRM Session Heartbeat:</strong> Temporary token leases to verify
                    single-device concurrency.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>Public Theatre Alias:</strong> Your selected display name for communal
                    reactions.
                  </span>
                </li>
              </ul>
            </div>

            {/* What we never collect */}
            <div className="bg-white/1 p-6">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="size-4" />
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  What We Never Collect
                </h4>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>
                    <strong>NIN or BVN:</strong> Sovereign identity numbers are strictly rejected.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>
                    <strong>Raw Credit Card Numbers:</strong> Processed exclusively by PCI-DSS
                    Paystack.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>
                    <strong>Social Ad Tracking Pixels:</strong> Zero integration with behavioral ad
                    brokers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">✕</span>
                  <span>
                    <strong>Biometric Identifiers:</strong> No face scans, fingerprints, or voice
                    prints.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 */}
      <section id="statutory-kyc" className="space-y-4 pt-8">
        <h2>4. In-Checkout KYC Protocol (Public Theatres Only)</h2>
        <p>
          We differentiate between solo viewing and communal gathering rooms to ensure viewer
          comfort and legal order:
        </p>

        <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-surface-1/60 p-5">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              Individual Watch &amp; Private Suites
            </Badge>
            <h4 className="mt-2 text-sm font-bold text-foreground">Zero KYC Protocol</h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Solo cinephiles and private party guests enter immediately with only an authenticated
              email address. No phone numbers or verified legal names are requested or stored.
            </p>
          </div>

          <div className="rounded-xl border border-brand/30 bg-surface-1/60 p-5">
            <Badge variant="outline" className="border-brand/40 text-brand">
              Public Theatres (Up to 1,000 Viewers)
            </Badge>
            <h4 className="mt-2 text-sm font-bold text-foreground">In-Checkout Verification</h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Conducted exclusively in-checkout during ticket purchase (never during platform
              sign-up). Uses HMAC-SHA256 one-way hashing to eliminate bot swarms and safeguard
              community civility.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 */}
      <section id="how-we-use-data" className="space-y-4 pt-8">
        <h2>5. Legal Bases &amp; Purpose of Processing</h2>
        <p>
          Under Section 25 of the NDPA 2023, personal data is processed strictly under lawful bases:
        </p>
        <ul>
          <li>
            <strong>Contract Performance:</strong> Issuing reserved ticket passes, provisioning
            synchronized Mux DRM streams, and handling Paystack transaction confirmations.
          </li>
          <li>
            <strong>Anti-Piracy &amp; Intellectual Property Protection:</strong> Generating dynamic
            Brownian motion watermarking on video playback viewports to prevent illicit recording
            and screen-scraping of African films.
          </li>
          <li>
            <strong>Regulatory &amp; Statutory Compliance:</strong> Upholding exhibition age ratings
            designated by the National Film and Video Censors Board (NFVCB) and meeting transaction
            reporting under Nigerian financial laws.
          </li>
        </ul>
      </section>

      {/* SECTION 6 */}
      <section id="payment-processing" className="space-y-4 pt-8">
        <h2>6. Payment Security &amp; Pass-Through Data</h2>
        <p>
          Koncave Cinema does not store, hold, or transmit raw credit card credentials, cardholder
          CVVs, or online banking authorization tokens. All payment processing is managed by{" "}
          <strong>Paystack Payments Limited</strong>, a PCI-DSS Level 1 certified processor
          regulated by the Central Bank of Nigeria (CBN).
        </p>
      </section>

      {/* SECTION 7 */}
      <section id="concession-delivery" className="space-y-4 pt-8">
        <h2>7. Concessions &amp; Geofencing (Chowdeck Relay)</h2>
        <p>
          When you order fresh cinema concessions (popcorn, hot food, drinks) alongside your
          premiere booking, your delivery address, contact phone number, and delivery notes are
          transmitted via TLS 1.3 encrypted API to our logistics provider,{" "}
          <strong>Chowdeck Relay</strong>.
        </p>
        <p>
          This transmission occurs solely to dispatch food before showtime and is never repurposed
          for marketing.
        </p>
      </section>

      {/* SECTION 8 */}
      <section id="data-retention" className="space-y-4 pt-8">
        <h2>8. Retention Schedules &amp; DRM Expiration</h2>
        <p>We enforce automated data obsolescence across our infrastructure:</p>
        <ul>
          <li>
            <strong>DRM Concurrency Leases:</strong> Stored in in-memory Redis stores with a strict
            Time-to-Live (TTL) of 45 seconds, expiring automatically when playback ends.
          </li>
          <li>
            <strong>Ephemeral Room Chat:</strong> Public Theatre emoji and reaction logs are purged
            within 24 hours of the premiere conclusion.
          </li>
          <li>
            <strong>Ticket Purchase Receipts:</strong> Stored in encrypted database records to
            fulfill statutory accounting audits under Nigerian law.
          </li>
        </ul>
      </section>

      {/* SECTION 9 */}
      <section id="your-rights" className="space-y-4 pt-8">
        <h2>9. Your NDPA 2023 Data Subject Rights</h2>
        <p>
          Under the Nigeria Data Protection Act 2023, every viewer possesses enforceable rights:
        </p>
        <ul>
          <li>
            <strong>Right to Access:</strong> Request a full machine-readable export of your stored
            account records.
          </li>
          <li>
            <strong>Right to Rectification:</strong> Update or amend your display alias and email
            preferences.
          </li>
          <li>
            <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request the
            permanent deletion of your profile and authentication tokens.
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> Opt out of non-essential communications
            or telemetry logging.
          </li>
        </ul>
      </section>

      {/* SECTION 10 */}
      <section id="privacy-contact" className="space-y-4 pt-8">
        <h2>10. Privacy Inquiries &amp; Contact</h2>
        <p>
          To exercise any data rights or submit an inquiry regarding our privacy architecture,
          please contact our team:
        </p>
        <div className="not-prose my-6 rounded-2xl border border-white/10 bg-surface-1/60 p-6">
          <p className="text-sm font-semibold text-foreground">Privacy &amp; Compliance Team</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <a
              href="mailto:info@koncavecinema.com"
              className="font-semibold text-brand hover:underline"
            >
              info@koncavecinema.com
            </a>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
