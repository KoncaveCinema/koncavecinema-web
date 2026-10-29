import { Ban, Cookie, Lock, Sliders } from "lucide-react";
import type { Metadata } from "next";

import { TERMS_UPDATED, type TocItem } from "@/features/legal/documents";
import { LegalPageShell } from "@/features/legal/page-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How Koncave Cinema uses one sign-in cookie and temporary checkout storage, with no advertising trackers.",
};

const TOC: TocItem[] = [
  { id: "what-are-cookies", title: "What Are Cookies & Local Storage?" },
  { id: "how-we-use-cookies", title: "How We Use Storage Technologies" },
  { id: "categories", title: "Categories of Storage We Use" },
  { id: "zero-ad-tracking", title: "Zero Third-Party Advertising Trackers" },
  { id: "managing-cookies", title: "Managing & Disabling Cookies" },
  { id: "updates-contact", title: "Policy Updates & Contact" },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie & Local Storage Policy"
      subtitle="Transparent information regarding how we utilize browser storage and essential session tokens to power your cinema streaming experience."
      effectiveDate="October 2026"
      lastUpdated={TERMS_UPDATED}
      toc={TOC}
      activePath="/cookies"
    >
      {/* In short */}
      <div className="not-prose mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Cookie className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Strictly Functional</h3>
              <p className="text-xs text-muted-foreground">Only what the service needs</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            One sign-in cookie, and checkout details kept for your browser tab. Nothing used for
            advertising.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/12 text-sky-400">
              <Ban className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Zero Advertising Trackers</h3>
              <p className="text-xs text-muted-foreground">No third-party behavioral cookies</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Koncave Cinema does not deploy third-party advertising scripts, marketing pixels, or
            commercial fingerprinting beacons.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-lobby/12 text-lobby">
              <Lock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Nothing Else Stored</h3>
              <p className="text-xs text-muted-foreground">One cookie, and that&rsquo;s all</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Your bookings and payments are kept on our servers. Apart from the sign-in cookie, we
            store nothing in your browser.
          </p>
        </Card>

        <Card className="gap-0 bg-white/2 p-5 ring-white/8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold">
              <Sliders className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">User Browser Control</h3>
              <p className="text-xs text-muted-foreground">Full autonomy in browser settings</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            You can clear, inspect, or block cookies anytime directly in Chrome, Safari, Firefox, or
            Edge browser preferences.
          </p>
        </Card>
      </div>

      {/* SECTION 1 */}
      <section id="what-are-cookies">
        <h2>What Are Cookies &amp; Local Storage?</h2>
        <p>
          Cookies are small text files a website stores in your browser. Websites can also keep
          information in the browser itself, using <code>sessionStorage</code> (erased when you
          close the tab) or <code>localStorage</code> (kept until you clear it).
        </p>
        <p>
          Koncave Cinema uses one cookie, to keep you signed in. We do not use{" "}
          <code>sessionStorage</code> or <code>localStorage</code>: your bookings live on our
          servers, so a reload never loses your place.
        </p>
      </section>

      {/* SECTION 2 */}
      <section id="how-we-use-cookies">
        <h2>How We Use Storage Technologies</h2>
        <ul>
          <li>
            <strong>Staying signed in:</strong> a secure cookie lets you stay signed in without
            entering your password on every visit. Your short-lived access token is kept only in the
            page&rsquo;s memory, never in browser storage.
          </li>
          <li>
            <strong>Checking out:</strong> your seat hold and payment are kept on our servers, not
            in your browser. A reload, or coming back from the payment page, picks up where you left
            off.
          </li>
          <li>
            <strong>Watching:</strong> playback tokens are not stored in your browser. The
            one-screen-per-ticket check runs on our servers.
          </li>
        </ul>
      </section>

      {/* SECTION 3 */}
      <section id="categories">
        <h2>Categories of Storage We Use</h2>
        <div className="not-prose my-6 overflow-hidden rounded-2xl border border-white/10 bg-surface-1/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/12 bg-white/4">
                  <th className="p-3 font-semibold text-foreground">Name</th>
                  <th className="p-3 font-semibold text-foreground">Type</th>
                  <th className="p-3 font-semibold text-foreground">Lifespan</th>
                  <th className="p-3 font-semibold text-foreground">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-muted-foreground">
                <tr>
                  <td className="p-3 font-mono text-foreground">refresh_token</td>
                  <td className="p-3">Cookie (HttpOnly, secure, same-site only)</td>
                  <td className="p-3">7 days</td>
                  <td className="p-3">
                    Keeps you signed in. Scripts on the page cannot read it, and it is sent only to
                    our sign-in service.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4 */}
      <section id="zero-ad-tracking">
        <h2>Zero Third-Party Advertising Trackers</h2>
        <p>
          We do not partner with third-party advertising networks, data brokers, or retargeting
          services. Specifically:
        </p>
        <ul>
          <li>We do NOT use Meta (Facebook) Pixel.</li>
          <li>We do NOT use Google AdSense or DoubleClick tracking tags.</li>
          <li>We do NOT use TikTok or Twitter conversion trackers.</li>
        </ul>
        <p>
          Your viewing choices, watch duration, and film preferences remain completely private
          between you and Koncave Cinema.
        </p>
      </section>

      {/* SECTION 5 */}
      <section id="managing-cookies">
        <h2>Managing &amp; Disabling Cookies</h2>
        <p>
          You have full control over browser cookies. You can configure your browser to reject all
          cookies or notify you when a cookie is placed.
        </p>
        <p>
          <em>Note:</em> Blocking the <code>refresh_token</code> cookie signs you out whenever you
          reload or leave the site, so you would need to sign in again each time.
        </p>
      </section>

      {/* SECTION 6 */}
      <section id="updates-contact">
        <h2>Policy Updates &amp; Contact</h2>
        <p>
          We may update this policy periodically to reflect architectural changes. Any updates will
          be published on this page with a revised date.
        </p>
        <p>
          For questions regarding our storage practices, contact our team at{" "}
          <a href="mailto:info@koncavecinema.com">info@koncavecinema.com</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
