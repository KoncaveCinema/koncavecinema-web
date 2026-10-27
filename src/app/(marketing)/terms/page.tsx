import { AlertTriangle, Clapperboard, CreditCard, Lock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import type { TocItem } from "@/features/legal/documents";
import { LegalPageShell } from "@/features/legal/page-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Review the Terms of Use governing admission, synchronized virtual cinema screenings, concurrency rules, and intellectual property on Koncave Cinema.",
};

const TOC: TocItem[] = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "theatrical-model", title: "The Virtual Theatrical Exhibition Model" },
  { id: "user-accounts", title: "Accounts & Public Theatre KYC" },
  { id: "ticketing-payment", title: "Ticketing, Pricing & Pass-Through Fees" },
  { id: "streaming-concurrency", title: "Streaming Policies & Concurrency Locks" },
  { id: "intellectual-property", title: "Intellectual Property & Anti-Piracy" },
  { id: "community-conduct", title: "Community Conduct & Prohibited Behavior" },
  { id: "refund-cancellation", title: "Refund & Cancellation Terms" },
  { id: "disclaimers", title: "Disclaimers & Limitation of Liability" },
  { id: "governing-law", title: "Governing Law & Dispute Resolution" },
];

export default function TermsOfUsePage() {
  return (
    <LegalPageShell
      title="Terms of Use & Theatrical Agreement"
      subtitle="The contractual framework governing virtual admissions, synchronized premiere showtimes, intellectual property protection, and community standards."
      effectiveDate="October 2026"
      lastUpdated="October 25, 2026"
      toc={TOC}
      activePath="/terms"
    >
      {/* In short */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Clapperboard className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Synchronized Showtimes</h3>
              <p className="text-xs text-muted-foreground">Opening-night theatrical premieres</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Films are presented as synchronized theatrical exhibitions. The virtual auditorium lobby
            opens 30 minutes prior to showtime; all viewers begin playback together.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/12 text-sky-400">
              <Lock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Single-Device Concurrency</h3>
              <p className="text-xs text-muted-foreground">Strict 1-ticket 1-screen integrity</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Each ticket pass authorizes exactly one active browser session. Launching a second
            viewport or sharing credentials instantly suspends the previous stream.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-lobby/12 text-lobby">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Forensic Anti-Piracy</h3>
              <p className="text-xs text-muted-foreground">Brownian motion watermarked playback</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Streams embed an imperceptible, dynamic watermark tied to your ticket session. Any
            attempt to record or redistribute content triggers immediate account ban and legal
            action.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold">
              <CreditCard className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Transparent Checkout</h3>
              <p className="text-xs text-muted-foreground">Direct processor pass-through pricing</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            All prices are clearly stated in Nigerian Naira. Standard payment gateway processing
            fees are itemized transparently at checkout with zero hidden surcharges.
          </p>
        </Card>
      </div>

      {/* SECTION 1 */}
      <section id="acceptance">
        <h2>Acceptance of Terms</h2>
        <p>
          These Terms of Use (&ldquo;Terms&rdquo;) constitute a legally binding agreement between
          you (&ldquo;Viewer&rdquo;, &ldquo;User&rdquo;, or &ldquo;You&rdquo;) and{" "}
          <strong>Koncave Cinema Nigeria Limited</strong> (&ldquo;Koncave Cinema&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), regulating your access to our
          web platform, virtual screening theatres, and premiere exhibition services.
        </p>
        <p>
          By creating an account, reserving an admission pass, or accessing any screening room, you
          confirm that you have read, understood, and agree to be bound by these Terms and our
          Privacy Policy. If you do not agree, you must not access or use the platform.
        </p>
      </section>

      {/* SECTION 2 */}
      <section id="theatrical-model">
        <h2>The Virtual Theatrical Exhibition Model</h2>
        <p>
          Koncave Cinema is not an on-demand video subscription service. We operate a{" "}
          <strong>virtual theatrical exhibition model</strong>, providing time-bound access to
          scheduled film premieres (&ldquo;Simulated Live&rdquo; events).
        </p>
        <ul>
          <li>
            <strong>Scheduled Showtimes:</strong> Films begin streaming at predetermined times. The
            screening lobby opens 30 minutes prior to showtime for audience seating.
          </li>
          <li>
            <strong>Synchronized Communal Viewing:</strong> All viewers experience the film
            concurrently. Live reactions and chats reflect real-time audience progression.
          </li>
          <li>
            <strong>Admission Formats:</strong> Viewers may select between Individual Watch (solo
            immersion), Public Theatres (communal hall with reactions), Private Suite 5, or Private
            Suite 10 (exclusive rooms with spatial voice chat).
          </li>
        </ul>
      </section>

      {/* SECTION 3 */}
      <section id="user-accounts">
        <h2>Accounts &amp; Public Theatre KYC</h2>
        <p>
          Account registration requires a valid email address verified via One-Time Password (OTP).
          You are responsible for safeguarding your login credentials.
        </p>
        <p>
          In compliance with the{" "}
          <strong>Cybercrimes (Prohibition, Prevention, etc.) Act 2015</strong> and the{" "}
          <strong>Nigeria Data Protection Act (NDPA 2023)</strong>:
        </p>
        <ul>
          <li>
            Admission into <strong>Public Theatres</strong> requires phone identity verification
            during ticket checkout to prevent abusive bot swarms. Solo viewers on Individual Watch
            and Private Suite guests are exempt from this requirement.
          </li>
          <li>
            In accordance with data minimization mandates, your raw telephone number is{" "}
            <strong>never stored in plaintext</strong>. It is cryptographically converted into an
            irreversible HMAC-SHA256 hash used solely for community civility and security
            enforcement.
          </li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section id="ticketing-payment">
        <h2>Ticketing, Pricing &amp; Pass-Through Fees</h2>
        <h3>4.1 Virtual Admission Passes</h3>
        <p>
          Admissions are time-bound, non-transferable digital licenses granting personal,
          non-commercial access to stream a specific film at a designated showtime. An admission
          pass does not convey master copyright, distribution rights, or offline download licenses.
        </p>

        <h3>4.2 Transparent Pricing &amp; Pass-Through Gateway Fees</h3>
        <p>
          Ticket prices are displayed in Nigerian Naira (NGN). Third-party payment gateway
          processing fees levied by our certified processor (Paystack) are transparently itemized at
          checkout and remitted directly to cover transaction clearing.
        </p>
        <p>
          Under the Nigeria Tax Act 2025 and Nigeria Tax Administration Act 2025, Koncave Cinema
          qualifies as an eligible small enterprise entity and does not assess VAT. Any future
          statutory amendments will be itemized explicitly.
        </p>
      </section>

      {/* SECTION 5 */}
      <section id="streaming-concurrency">
        <h2>Streaming Policies &amp; Concurrency Locks</h2>
        <h3>5.1 Single-Viewer Concurrency Lock</h3>
        <p>
          Each admission pass is strictly licensed for a{" "}
          <strong>single concurrent device and viewport</strong>. Attempting to access the stream
          simultaneously from a second browser tab, device, or remote network will immediately
          suspend the prior session.
        </p>

        <h3>5.2 Adaptive Playback &amp; Catch-Up Engine</h3>
        <p>
          Playback quality adapts dynamically to your network connection. If local buffering causes
          you to lag behind the live broadcast, our 4-Zone Catch-Up Engine applies subtle
          acceleration to resynchronize you with the audience edge without distortion.
        </p>
      </section>

      {/* SECTION 6 */}
      <section id="intellectual-property">
        <h2>Intellectual Property &amp; Anti-Piracy</h2>
        <p>
          All titles exhibited on Koncave Cinema are protected under Nigerian copyright laws and
          international treaties. Content is secured via multi-DRM encryption and dynamic forensic
          watermarking.
        </p>
        <div className="not-prose my-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-rose-400" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Anti-Piracy Zero Tolerance</h4>
              <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
                Any attempt to record, screen-capture, scrape, rebroadcast, or reverse-engineer
                streams constitutes a criminal violation under the Cybercrimes Act 2015. Violations
                result in instant termination of access, forfeiture of tickets, and referral to the
                Nigerian Copyright Commission (NCC).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 */}
      <section id="community-conduct">
        <h2>Community Conduct &amp; Prohibited Behavior</h2>
        <p>
          When participating in Public Theatres or Private Suites, users must maintain an atmosphere
          of mutual respect. Prohibited conduct includes:
        </p>
        <ul>
          <li>Hate speech, tribal harassment, defamation, or discriminatory comments.</li>
          <li>Posting commercial advertisements, spam, malicious links, or referral codes.</li>
          <li>Disruptive behavior or continuous spamming of chat and reaction channels.</li>
        </ul>
        <p>
          Auditorium moderators reserve the absolute authority to mute, kick, or permanently
          blacklist violators.
        </p>
      </section>

      {/* SECTION 8 */}
      <section id="refund-cancellation">
        <h2>Refund &amp; Cancellation Terms</h2>
        <p>
          Because virtual tickets reserve dedicated capacity in scheduled theatrical screening
          rooms, ticket purchases are generally non-refundable once confirmed. Exceptions and
          automatic credit re-issuances for platform technical interruptions are governed strictly
          by our dedicated <a href="/refunds">Refund &amp; Cancellation Policy</a>.
        </p>
      </section>

      {/* SECTION 9 */}
      <section id="disclaimers">
        <h2>Disclaimers &amp; Limitation of Liability</h2>
        <p>
          Koncave Cinema provides its exhibition platform on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis. While we engineer high availability across multi-region CDNs, we
          cannot guarantee uninterrupted playback in the event of local ISP broadband failures,
          power outages, or unsupported viewer hardware.
        </p>
      </section>

      {/* SECTION 10 */}
      <section id="governing-law">
        <h2>Governing Law &amp; Dispute Resolution</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of the{" "}
          <strong>Federal Republic of Nigeria</strong>. Any disputes arising out of or in connection
          with these Terms shall be settled amicably through conciliation, or failing which,
          submitted to the exclusive jurisdiction of the state or federal courts situated in Lagos
          State, Nigeria.
        </p>
      </section>
    </LegalPageShell>
  );
}
