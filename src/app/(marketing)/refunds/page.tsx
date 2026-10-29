import { Clock, RefreshCw, ShieldCheck, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TERMS_UPDATED, type TocItem } from "@/features/legal/documents";
import { LegalPageShell } from "@/features/legal/page-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Understand the refund and cancellation policies for virtual cinema admissions, technical stream interruptions, and Chowdeck concessions on Koncave Cinema.",
};

const TOC: TocItem[] = [
  { id: "overview", title: "Overview & Virtual Goods Policy" },
  { id: "eligible-refunds", title: "When Refunds Are Guaranteed" },
  { id: "ineligible-situations", title: "Non-Refundable Situations" },
  { id: "concessions-refunds", title: "Concessions & Food Delivery Refunds" },
  { id: "refund-methods", title: "Refund Methods & Settlement Times" },
  { id: "how-to-request", title: "How to File a Refund Claim" },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Refund & Cancellation Policy"
      subtitle="Clear, fair rules regarding virtual admissions, platform technical faults, overbooking protection, and food delivery refunds."
      effectiveDate="October 2026"
      lastUpdated={TERMS_UPDATED}
      toc={TOC}
      activePath="/refunds"
    >
      {/* In short */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
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

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Faults on Our Side</h3>
              <p className="text-xs text-muted-foreground">Refunded on request</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            If a fault on our side stops your screening, contact us. Once we confirm it, we refund
            your ticket or give you a pass to another showtime.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/12 text-sky-400">
              <RefreshCw className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Late or Duplicate Payments</h3>
              <p className="text-xs text-muted-foreground">Reviewed and refunded by our team</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            If a payment clears after your 10-minute hold has expired, or you are charged twice, our
            team reviews it and refunds you in full.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
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
            Damaged, spilled or missing snack orders are refunded once you report them to our team.
          </p>
        </Card>
      </div>

      {/* SECTION 1 */}
      <section id="overview">
        <h2>Overview &amp; Virtual Goods Policy</h2>
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
      <section id="eligible-refunds">
        <h2>When Refunds Are Guaranteed</h2>
        <p>We refund your ticket, or offer a pass to another showtime, in these cases:</p>
        <ul>
          <li>
            <strong>Screening Cancellation:</strong> The filmmaker, distributor, or Koncave Cinema
            cancels the scheduled showtime.
          </li>
          <li>
            <strong>A Fault on Our Side:</strong> Downtime or a streaming failure on our side that
            stops you from watching the screening. These are handled on request, once we have
            confirmed the fault.
          </li>
          <li>
            <strong>Late or Duplicate Payments:</strong> If a payment arrives after your 10-minute
            hold has expired, or the same booking is charged twice, our team reviews it and refunds
            the payment in full.
          </li>
        </ul>
      </section>

      {/* SECTION 3 */}
      <section id="ineligible-situations">
        <h2>Non-Refundable Situations</h2>
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
            rooted or jailbroken devices, outdated operating systems, or browsers that cannot play
            protected video.
          </li>
          <li>
            <strong>Subjective Creative Opinion:</strong> Dissatisfaction with a film&rsquo;s
            artistic direction, dialogue, or ending.
          </li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section id="concessions-refunds">
        <h2>Concessions &amp; Food Delivery Refunds</h2>
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

      {/* SECTION 6 */}
      <section id="refund-methods">
        <h2>Refund Methods &amp; Settlement Times</h2>
        <p>Approved refunds are processed through the original method of payment:</p>
        <ul>
          <li>
            <strong>Paystack Card Reversals:</strong> Usually reflected on your bank card statement
            within 3–7 business days, depending on your commercial bank&rsquo;s clearing cycle.
          </li>
          <li>
            <strong>Direct Bank Account Transfers:</strong> Settled within 24–48 banking hours.
          </li>
        </ul>
      </section>

      {/* SECTION 7 */}
      <section id="how-to-request">
        <h2>How to File a Refund Claim</h2>
        <p>
          To submit a refund request, contact our concierge desk within 24 hours of the affected
          screening:
        </p>
        <div className="not-prose my-6 rounded-2xl border border-white/10 bg-surface-1/60 p-6">
          <h4 className="text-sm font-semibold text-foreground">Audience Support Concierge</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide your registered email address, your pass number (for example PASS-000001), and a
            brief description of the issue.
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
