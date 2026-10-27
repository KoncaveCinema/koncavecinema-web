import { Clock, RefreshCw, ShieldCheck, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell, type TocItem } from "@/components/layout/legal-page-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Koncave Cinema",
  description:
    "Understand the refund and cancellation policies for virtual cinema admissions, technical stream interruptions, and Chowdeck concessions on Koncave Cinema.",
};

const TOC: TocItem[] = [
  { id: "overview", title: "1. Overview & Virtual Goods Policy" },
  { id: "eligible-refunds", title: "2. When Refunds Are Guaranteed" },
  { id: "ineligible-situations", title: "3. Non-Refundable Situations" },
  { id: "concessions-refunds", title: "4. Concessions & Food Delivery Refunds" },
  { id: "private-suite-rules", title: "5. Private VIP Suite Rescheduling" },
  { id: "refund-methods", title: "6. Refund Methods & Settlement Times" },
  { id: "how-to-request", title: "7. How to File a Refund Claim" },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Refund & Cancellation Policy"
      subtitle="Clear, fair rules regarding virtual admissions, platform technical faults, overbooking protection, and food delivery refunds."
      effectiveDate="October 2026"
      lastUpdated="October 25, 2026"
      version="1.3.0"
      toc={TOC}
      activePath="/refunds"
    >
      {/* =========================================================================
          CREATIVE AT-A-GLANCE SUMMARY CARDS
          ========================================================================= */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Clock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Time-Bound Reservations</h3>
              <p className="text-xs text-muted-foreground">Reserved seating in scheduled halls</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Admissions secure dedicated capacity in real-time screening rooms. Like physical cinema
            tickets, purchases are non-refundable once confirmed except for platform fault.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Outage Protection Guarantee</h3>
              <p className="text-xs text-muted-foreground">
                Automated remediation for verified issues
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            If our distribution network, DRM licensing, or server infrastructure fails during your
            showtime, you are automatically granted a full refund or replacement premiere pass.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <RefreshCw className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Delayed Payment Protection</h3>
              <p className="text-xs text-muted-foreground">
                Automatic return on overbooked sessions
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            If a bank transfer clears after the 10-minute hold expires and the room is full, funds
            are automatically queued for an immediate full reversal.
          </p>
        </Card>

        <Card className="border-white/10 bg-surface-1/80 p-5 backdrop-blur-md transition-all hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Utensils className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Concessions Guarantee</h3>
              <p className="text-xs text-muted-foreground">Chowdeck Relay delivery protection</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Damaged, spilled, or non-delivered snack orders are resolved instantly through our live
            concierge with prompt wallet or bank refunds.
          </p>
        </Card>
      </div>

      {/* SECTION 1 */}
      <section id="overview" className="space-y-4">
        <h2>1. Overview &amp; Virtual Goods Policy</h2>
        <p>
          Koncave Cinema provides synchronized &ldquo;Simulated Live&rdquo; theatrical exhibition
          experiences. When you purchase an admission pass (whether for Individual Watch, Public
          Theatres, or Private VIP Suites), you are purchasing a time-bound virtual seat in a
          scheduled screening.
        </p>
        <p>
          Because seats in screening rooms are limited and synchronized to specific showtimes,{" "}
          <strong>tickets are non-refundable once purchased</strong>, except under the explicit
          technical and operational circumstances outlined in this policy.
        </p>
      </section>

      {/* SECTION 2 */}
      <section id="eligible-refunds" className="space-y-4 pt-8">
        <h2>2. When Refunds Are Guaranteed</h2>
        <p>
          We stand firmly behind our platform reliability. You are entitled to an immediate full
          refund or complimentary ticket voucher in any of the following events:
        </p>
        <ul>
          <li>
            <strong>Screening Cancellation:</strong> The filmmaker, distributor, or Koncave Cinema
            cancels the scheduled showtime.
          </li>
          <li>
            <strong>Verified Platform Infrastructure Outage:</strong> Unscheduled server downtime,
            CDN delivery blackouts, or DRM licensing engine failures that prevent attendees from
            completing their screening.
          </li>
          <li>
            <strong>Confirmed Regional Stream Blackout:</strong> Independent verification from our
            video infrastructure partner confirming systemic delivery failure during your showtime
            window.
          </li>
          <li>
            <strong>Expired Seat Hold Reconciliation:</strong> If a delayed bank transfer or late
            checkout payment arrives after the 10-minute hold expires, and the auditorium is at full
            capacity, the payment is automatically refunded in full.
          </li>
        </ul>
      </section>

      {/* SECTION 3 */}
      <section id="ineligible-situations" className="space-y-4 pt-8">
        <h2>3. Non-Refundable Situations</h2>
        <p>
          We cannot issue refunds or credits for user-side issues beyond the control of Koncave
          Cinema, including:
        </p>
        <ul>
          <li>
            <strong>Late Arrival or Missed Showtimes:</strong> Failure to enter the screening room
            or missing the scheduled start time. (Note: The room remains open for 15 minutes
            post-credits to accommodate minor delays).
          </li>
          <li>
            <strong>Local ISP Connectivity Issues:</strong> Local cellular data throttling, mobile
            network drops (MTN, Airtel, Glo), or neighborhood power cuts during the screening. We
            recommend a steady broadband connection for smooth high-bitrate streaming.
          </li>
          <li>
            <strong>Unsupported Devices or Modified Hardware:</strong> Attempting to stream on
            rooted/jailbroken devices, outdated operating systems, or browsers that block encrypted
            media extensions (DRM).
          </li>
          <li>
            <strong>Subjective Creative Opinion:</strong> Dissatisfaction with a film&rsquo;s
            artistic direction, dialogue, or ending.
          </li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section id="concessions-refunds" className="space-y-4 pt-8">
        <h2>4. Concessions &amp; Food Delivery Refunds</h2>
        <p>
          Concession orders (popcorn, combos, drinks) are fulfilled through our delivery integration
          with <strong>Chowdeck Relay</strong>.
        </p>
        <ul>
          <li>
            <strong>Defective or Spilled Orders:</strong> If food arrives damaged, spilled, or
            unsealed, notify our support concierge within 30 minutes of delivery with a photo for an
            immediate refund.
          </li>
          <li>
            <strong>Delayed Delivery Beyond Showtime:</strong> If delivery arrives significantly
            after the film has concluded due to logistics partner delays, a full concession refund
            is provided.
          </li>
        </ul>
      </section>

      {/* SECTION 5 */}
      <section id="private-suite-rules" className="space-y-4 pt-8">
        <h2>5. Private VIP Suite Rescheduling</h2>
        <p>
          Unlike Public Theatres, <strong>Private VIP Suites (Suite 5 and Suite 10)</strong> grant
          the host the flexibility to reschedule their private screening up to 2 hours before the
          scheduled premiere time.
        </p>
        <p>
          Rescheduled private screenings must be set to a new showtime within 14 calendar days of
          the original date.
        </p>
      </section>

      {/* SECTION 6 */}
      <section id="refund-methods" className="space-y-4 pt-8">
        <h2>6. Refund Methods &amp; Settlement Times</h2>
        <p>Approved refunds are processed through the original method of payment:</p>
        <ul>
          <li>
            <strong>Paystack Card Reversals:</strong> Usually reflected on your bank card statement
            within 3–7 business days, depending on your commercial bank&rsquo;s clearing cycle.
          </li>
          <li>
            <strong>Direct Bank Account Transfers:</strong> Settled within 24–48 banking hours.
          </li>
          <li>
            <strong>Koncave Premiere Credit Vouchers:</strong> Issued instantly to your registered
            email for immediate use on any future screening.
          </li>
        </ul>
      </section>

      {/* SECTION 7 */}
      <section id="how-to-request" className="space-y-4 pt-8">
        <h2>7. How to File a Refund Claim</h2>
        <p>
          To submit a refund request, contact our concierge desk within 24 hours of the affected
          screening:
        </p>
        <div className="not-prose my-6 rounded-2xl border border-white/10 bg-surface-1/60 p-6">
          <h4 className="text-sm font-semibold text-foreground">Audience Support Concierge</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide your registered email address, 6-character Ticket Code, and a brief description
            of the issue.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <a
              href="mailto:info@koncavecinema.com"
              className="font-semibold text-brand hover:underline"
            >
              info@koncavecinema.com
            </a>
            <span className="text-white/20">|</span>
            <Link href="/contact" className="font-semibold text-brand hover:underline">
              Submit Direct Concierge Dispatch →
            </Link>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
