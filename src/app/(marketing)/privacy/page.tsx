import { Ban, CheckCircle2, EyeOff, Fingerprint, Lock, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";

import { TERMS_UPDATED, type TocItem } from "@/features/legal/documents";
import { LegalPageShell } from "@/features/legal/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy & NDPA Compliance",
  description:
    "Learn how Koncave Cinema safeguards your personal data under the Nigeria Data Protection Act (NDPA 2023) through data minimization and cryptographic hashing.",
};

const TOC: TocItem[] = [
  { id: "principles", title: "Privacy Principles & Architecture" },
  { id: "data-minimization", title: "NDPA 2023 Data Minimization (No NIN/BVN)" },
  { id: "information-matrix", title: "Information We Collect vs What We Never Collect" },
  { id: "statutory-kyc", title: "In-Checkout KYC Protocol (Public Theatres)" },
  { id: "how-we-use-data", title: "Legal Bases & Purpose of Processing" },
  { id: "payment-processing", title: "Payments & Service Providers" },
  { id: "concession-delivery", title: "Concessions & Geofencing (Chowdeck Relay)" },
  { id: "data-retention", title: "How Long We Keep Data" },
  { id: "your-rights", title: "Your NDPA 2023 Data Subject Rights" },
  { id: "privacy-contact", title: "Privacy Inquiries & Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy & NDPA 2023 Compliance"
      subtitle="Koncave Cinema is built on strict data minimization. We protect your privacy while delivering synchronized, premium virtual cinema premieres."
      effectiveDate="October 2026"
      lastUpdated={TERMS_UPDATED}
      toc={TOC}
      activePath="/privacy"
    >
      {/* In short */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
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

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/12 text-sky-400">
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

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-lobby/12 text-lobby">
              <Lock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Protected Playback</h3>
              <p className="text-xs text-muted-foreground">
                Expiring tokens and a personal watermark
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Each screening plays with signed, short-lived tokens and a visible watermark tied to
            your ticket. Studio-grade DRM will be added later.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold">
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
      <section id="principles">
        <h2>Privacy Principles &amp; Architecture</h2>
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
      <section id="data-minimization">
        <h2>NDPA 2023 Data Minimization (Why We Never Collect NIN or BVN)</h2>
        <p>
          Under Section 24 of the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>, personal
          data processing must be adequate, relevant, and limited to what is strictly necessary in
          relation to the declared purposes (the &ldquo;Proportionality Principle&rdquo;).
        </p>

        <div className="not-prose my-6 rounded-2xl border border-brand/30 bg-brand/5 p-6">
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
      <section id="information-matrix">
        <h2>Information We Collect vs What We Never Collect</h2>
        <p>
          To maintain absolute transparency, the matrix below contrasts the operational metadata we
          collect with the intrusive data points we reject by default:
        </p>

        <div className="not-prose my-6 overflow-hidden rounded-2xl border border-white/10 bg-surface-1/80">
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
                    <strong>Account Email and Password:</strong> To sign you in and send your
                    tickets. Your password is stored only as a secure hash.
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
                    <strong>Playback Session:</strong> A 90-second lease, renewed every 45 seconds
                    while you watch, so one ticket plays on one screen.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>Public Hall Identity Check:</strong> Your phone number (kept only as a
                    one-way hash), your legal full name (encrypted) and the screen alias shown in
                    hall chat.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong>Connection Details at Playback:</strong> Your IP address and approximate
                    location, to detect account sharing.
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
      <section id="statutory-kyc">
        <h2>In-Checkout KYC Protocol (Public Theatres Only)</h2>
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
              Done once, when you book a Public Hall seat, never at sign-up. The code is emailed to
              you. Your phone number is kept only as a one-way hash, your legal full name is
              encrypted, and only your screen alias is shown in the hall.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 */}
      <section id="how-we-use-data">
        <h2>Legal Bases &amp; Purpose of Processing</h2>
        <p>
          Under Section 25 of the NDPA 2023, personal data is processed strictly under lawful bases:
        </p>
        <ul>
          <li>
            <strong>Contract Performance:</strong> Issuing your passes, streaming the film to your
            ticket at its showtime, and confirming payments with Paystack.
          </li>
          <li>
            <strong>Anti-Piracy &amp; Intellectual Property Protection:</strong> Showing a visible
            personal watermark during playback, and checking your IP address and approximate
            location to detect account sharing, so films are protected from recording and resale.
            Location is estimated with{" "}
            <a href="https://db-ip.com" target="_blank" rel="noreferrer">
              IP Geolocation by DB-IP
            </a>
            .
          </li>
          <li>
            <strong>Regulatory &amp; Statutory Compliance:</strong> Upholding exhibition age ratings
            designated by the National Film and Video Censors Board (NFVCB) and meeting transaction
            reporting under Nigerian financial laws.
          </li>
        </ul>
      </section>

      {/* SECTION 6 */}
      <section id="payment-processing">
        <h2>Payments &amp; Service Providers</h2>
        <p>
          Koncave Cinema does not store, hold, or transmit raw credit card credentials, cardholder
          CVVs, or online banking authorization tokens. All payment processing is managed by{" "}
          <strong>Paystack Payments Limited</strong>, a PCI-DSS Level 1 certified processor
          regulated by the Central Bank of Nigeria (CBN).
        </p>
        <p>
          We share personal data only with the providers that run the service, under contract and
          only for that purpose:
        </p>
        <ul>
          <li>
            <strong>Paystack</strong>: payments.
          </li>
          <li>
            <strong>Mux</strong>: video streaming.
          </li>
          <li>
            <strong>Resend</strong>: email, including your sign-in and verification codes.
          </li>
          <li>
            <strong>Supabase</strong>: database hosting.
          </li>
          <li>
            <strong>Upstash</strong>: temporary data such as playback sessions.
          </li>
          <li>
            <strong>LiveKit</strong> (voice in private suites) and <strong>Chowdeck</strong> (snack
            delivery), when those features launch.
          </li>
        </ul>
      </section>

      {/* SECTION 7 */}
      <section id="concession-delivery">
        <h2>Concessions &amp; Geofencing (Chowdeck Relay)</h2>
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
      <section id="data-retention">
        <h2>How Long We Keep Data</h2>
        <p>We keep data only as long as it is needed:</p>
        <ul>
          <li>
            <strong>Playback leases:</strong> 90 seconds, renewed every 45 seconds while you watch,
            and gone when playback stops.
          </li>
          <li>
            <strong>Location checks:</strong> your IP address and approximate location, for up to 6
            hours.
          </li>
          <li>
            <strong>Security logs:</strong> IP address and browser details, kept to investigate
            misuse of accounts.
          </li>
          <li>
            <strong>Ticket and payment records:</strong> kept to meet accounting and tax obligations
            under Nigerian law.
          </li>
        </ul>
      </section>

      {/* SECTION 9 */}
      <section id="your-rights">
        <h2>Your NDPA 2023 Data Subject Rights</h2>
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
      <section id="privacy-contact">
        <h2>Privacy Inquiries &amp; Contact</h2>
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
