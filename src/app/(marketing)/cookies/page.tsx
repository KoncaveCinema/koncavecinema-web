import { Ban, Cookie, Lock, Sliders } from "lucide-react";
import type { Metadata } from "next";

import type { TocItem } from "@/features/legal/documents";
import { LegalPageShell } from "@/features/legal/page-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how Koncave Cinema uses essential cookies and local storage tokens for session security and DRM playback without third-party ad trackers.",
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
      lastUpdated="October 25, 2026"
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
              <p className="text-xs text-muted-foreground">
                Essential for streaming &amp; security
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            We store only what is required to maintain authenticated logins, provision Mux DRM keys,
            and preserve volume and closed-captioning preferences.
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
              <h3 className="text-sm font-bold text-foreground">Ephemeral Concurrency Leases</h3>
              <p className="text-xs text-muted-foreground">Auto-clearing session memory</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Screening leases in sessionStorage automatically erase the moment you close your browser
            tab or the film concludes.
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
          Cookies are small text files placed on your device by websites you visit. Modern web
          applications also rely on browser-native storage technologies such as{" "}
          <code>localStorage</code> and <code>sessionStorage</code> to deliver high-performance,
          responsive experiences.
        </p>
        <p>
          Koncave Cinema utilizes these technologies strictly to authenticate viewer sessions,
          manage DRM playback tokens, and remember your theatre audio and subtitle preferences.
        </p>
      </section>

      {/* SECTION 2 */}
      <section id="how-we-use-cookies">
        <h2>How We Use Storage Technologies</h2>
        <p>
          When you stream on Koncave Cinema, storage technologies fulfill essential technical roles:
        </p>
        <ul>
          <li>
            <strong>Session Authentication:</strong> Keeping you securely authenticated across
            screening rooms without requiring repeated OTP logins.
          </li>
          <li>
            <strong>DRM Licensing:</strong> Securely holding short-lived decryption tokens for
            hardware Mux Multi-DRM video streams.
          </li>
          <li>
            <strong>Single-Device Concurrency:</strong> Storing temporary session lease IDs to
            verify that each admission pass is active on only one screen at a time.
          </li>
          <li>
            <strong>Viewer Preferences:</strong> Remembering audio volume, mute state, closed
            captions, and ambient theatre lighting choices between screenings.
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
                  <th className="p-3 font-semibold text-foreground">Storage Key</th>
                  <th className="p-3 font-semibold text-foreground">Type</th>
                  <th className="p-3 font-semibold text-foreground">Lifespan</th>
                  <th className="p-3 font-semibold text-foreground">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-muted-foreground">
                <tr>
                  <td className="p-3 font-mono text-foreground">kc_session</td>
                  <td className="p-3">HTTP-Only Cookie</td>
                  <td className="p-3">7 Days</td>
                  <td className="p-3">Encrypted JWT user authentication token.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">kc_lease_id</td>
                  <td className="p-3">sessionStorage</td>
                  <td className="p-3">Screening Duration</td>
                  <td className="p-3">Enforces single-device concurrency lock for active film.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">kc_audio_prefs</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">1 Year</td>
                  <td className="p-3">
                    Remembers default volume, mute state, and subtitle choices.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-foreground">kc_theme</td>
                  <td className="p-3">localStorage</td>
                  <td className="p-3">Persistent</td>
                  <td className="p-3">Stores ambient auditorium contrast and UI settings.</td>
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
          <em>Note:</em> Disabling essential cookies (such as <code>kc_session</code>) will prevent
          you from logging in, reserving tickets, and entering screening rooms.
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
